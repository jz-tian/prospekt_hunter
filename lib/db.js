import { createClient } from "@libsql/client";
import { CATEGORY_DEFINITIONS, RETAILERS } from "@/lib/constants";
import { SAMPLE_FIXTURES } from "@/lib/sample-data";
import { categorizeOffer } from "@/lib/classification";
import { selectFeaturedOffers } from "@/lib/featured-offers";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:.data/local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// ── Low-level helpers ─────────────────────────────────────────

async function run(sql, args = []) {
  return db.execute({ sql, args });
}

async function get(sql, args = []) {
  const { rows } = await db.execute({ sql, args });
  return rows[0] ?? null;
}

async function all(sql, args = []) {
  const { rows } = await db.execute({ sql, args });
  return rows;
}

// ── Init singleton ────────────────────────────────────────────

let _ready = null;
function ensureInit() {
  if (!_ready) _ready = initialize();
  return _ready;
}

async function initialize() {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS retailers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      tone TEXT NOT NULL,
      text_color TEXT NOT NULL,
      parent_id INTEGER
    );
    CREATE TABLE IF NOT EXISTS prospekt_issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      retailer_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      week_scope TEXT NOT NULL DEFAULT 'current',
      valid_from TEXT NOT NULL,
      valid_to TEXT NOT NULL,
      source_url TEXT NOT NULL,
      asset_path TEXT,
      source_type TEXT NOT NULL DEFAULT 'fixture',
      status TEXT NOT NULL DEFAULT 'ready',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(retailer_id, title, valid_from, valid_to)
    );
    CREATE TABLE IF NOT EXISTS offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prospekt_issue_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      brand TEXT,
      original_price REAL,
      sale_price REAL NOT NULL,
      price_label TEXT,
      offer_kind TEXT NOT NULL DEFAULT 'product',
      discount_percent INTEGER,
      unit_info TEXT,
      image_url TEXT,
      product_url TEXT,
      category_id INTEGER,
      source_section TEXT,
      confidence_score REAL NOT NULL DEFAULT 0.5,
      review_state TEXT NOT NULL DEFAULT 'approved',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS shopping_list_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      offer_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      note TEXT,
      checked INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(offer_id)
    );
    CREATE TABLE IF NOT EXISTS ingest_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      status TEXT NOT NULL,
      detail TEXT,
      started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Column migrations — idempotent, ignore "already exists" errors
  for (const ddl of [
    "ALTER TABLE prospekt_issues ADD COLUMN week_scope TEXT NOT NULL DEFAULT 'current'",
    "ALTER TABLE offers ADD COLUMN image_url TEXT",
    "ALTER TABLE offers ADD COLUMN product_url TEXT",
    "ALTER TABLE offers ADD COLUMN price_label TEXT",
    "ALTER TABLE offers ADD COLUMN offer_kind TEXT NOT NULL DEFAULT 'product'",
  ]) {
    try {
      await run(ddl);
    } catch (e) {
      if (!String(e.message).includes("duplicate column name") && !String(e.message).includes("already exists")) {
        throw e;
      }
    }
  }

  await syncStaticData();
  await cleanupRemovedCategories();
  await cleanupRemovedRetailers();
  await seedAllData();
}

async function seedAllData() {
  const seeded = await get("SELECT value FROM app_state WHERE key = 'fixture_seed_v4'");
  if (seeded?.value === "done") return;
  await seedFixtures();
  await run("INSERT OR REPLACE INTO app_state (key, value) VALUES ('fixture_seed_v4', 'done')");
}

async function syncStaticData() {
  const stmts = [];
  for (const r of RETAILERS) {
    stmts.push({ sql: "INSERT OR IGNORE INTO retailers (slug, name, color) VALUES (?, ?, ?)", args: [r.slug, r.name, r.color] });
    stmts.push({ sql: "UPDATE retailers SET name = ?, color = ? WHERE slug = ?", args: [r.name, r.color, r.slug] });
  }
  for (const c of CATEGORY_DEFINITIONS) {
    stmts.push({ sql: "INSERT OR IGNORE INTO categories (slug, name, tone, text_color, parent_id) VALUES (?, ?, ?, ?, NULL)", args: [c.slug, c.name, c.tone, c.textColor] });
    stmts.push({ sql: "UPDATE categories SET name = ?, tone = ?, text_color = ? WHERE slug = ?", args: [c.name, c.tone, c.textColor, c.slug] });
  }
  await db.batch(stmts, "write");
}

async function seedFixtures() {
  await db.batch([
    { sql: "DELETE FROM shopping_list_items", args: [] },
    { sql: "DELETE FROM offers", args: [] },
    { sql: "DELETE FROM prospekt_issues", args: [] },
  ], "write");

  const categoryRows = await all("SELECT id, slug FROM categories");
  const categoryMap = Object.fromEntries(categoryRows.map((c) => [c.slug, Number(c.id)]));

  for (const [retailerSlug, fixturesByWeek] of Object.entries(SAMPLE_FIXTURES)) {
    const retailer = await get("SELECT id FROM retailers WHERE slug = ?", [retailerSlug]);

    for (const fixture of Object.values(fixturesByWeek)) {
      const issueResult = await run(
        `INSERT OR IGNORE INTO prospekt_issues
         (retailer_id, title, week_scope, valid_from, valid_to, source_url, asset_path, source_type, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ready')`,
        [
          retailer.id, fixture.issue.title, fixture.issue.weekScope ?? "current",
          fixture.issue.validFrom, fixture.issue.validTo, fixture.issue.sourceUrl,
          fixture.issue.assetPath, fixture.issue.sourceType,
        ]
      );

      const issueId = Number(issueResult.lastInsertRowid ?? 0) || (await get(
        "SELECT id FROM prospekt_issues WHERE retailer_id = ? AND title = ? AND week_scope = ? AND valid_from = ? AND valid_to = ?",
        [retailer.id, fixture.issue.title, fixture.issue.weekScope ?? "current", fixture.issue.validFrom, fixture.issue.validTo]
      ))?.id;

      if (!fixture.offers.length) continue;

      const offerStmts = fixture.offers.map((offer) => {
        const categorySlug = categorizeOffer(offer);
        return {
          sql: `INSERT INTO offers
                (prospekt_issue_id, product_name, brand, sale_price, price_label, offer_kind, unit_info, image_url, product_url, category_id, source_section, confidence_score, review_state)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            issueId, offer.productName, offer.brand ?? null, offer.salePrice,
            offer.priceLabel ?? null, offer.offerKind ?? "product", offer.unitInfo ?? null,
            offer.imageUrl ?? null, offer.productUrl ?? null, categoryMap[categorySlug] ?? null,
            offer.sourceSection ?? null, offer.confidenceScore ?? 0.5,
            (offer.confidenceScore ?? 0.5) >= 0.75 ? "approved" : "needs_review",
          ],
        };
      });
      await db.batch(offerStmts, "write");
    }
  }
}

async function cleanupRemovedRetailers() {
  const activeSlugs = new Set(RETAILERS.map((r) => r.slug));
  const stale = (await all("SELECT id, slug FROM retailers")).filter((r) => !activeSlugs.has(r.slug));
  for (const retailer of stale) {
    await db.batch([
      { sql: "DELETE FROM shopping_list_items WHERE offer_id IN (SELECT id FROM offers WHERE prospekt_issue_id IN (SELECT id FROM prospekt_issues WHERE retailer_id = ?))", args: [retailer.id] },
      { sql: "DELETE FROM offers WHERE prospekt_issue_id IN (SELECT id FROM prospekt_issues WHERE retailer_id = ?)", args: [retailer.id] },
      { sql: "DELETE FROM prospekt_issues WHERE retailer_id = ?", args: [retailer.id] },
      { sql: "DELETE FROM retailers WHERE id = ?", args: [retailer.id] },
    ], "write");
  }
}

async function cleanupRemovedCategories() {
  const activeSlugs = new Set(CATEGORY_DEFINITIONS.map((c) => c.slug));
  const stale = (await all("SELECT id, slug FROM categories")).filter((c) => !activeSlugs.has(c.slug));
  for (const category of stale) {
    await db.batch([
      { sql: "UPDATE offers SET category_id = NULL WHERE category_id = ?", args: [category.id] },
      { sql: "DELETE FROM categories WHERE id = ?", args: [category.id] },
    ], "write");
  }
}

// ── Helpers ───────────────────────────────────────────────────

function normalizeWeekScope(weekScope = "current") {
  return weekScope === "next" ? "next" : "current";
}

function baseOfferQuery(whereClause = "", orderClause = "") {
  return `
    SELECT
      offers.id,
      offers.product_name AS productName,
      offers.brand,
      offers.original_price AS originalPrice,
      offers.sale_price AS salePrice,
      offers.price_label AS priceLabel,
      offers.offer_kind AS offerKind,
      offers.unit_info AS unitInfo,
      offers.image_url AS imageUrl,
      offers.product_url AS productUrl,
      offers.source_section AS sourceSection,
      offers.confidence_score AS confidenceScore,
      offers.review_state AS reviewState,
      categories.id AS categoryId,
      categories.slug AS categorySlug,
      categories.name AS categoryName,
      retailers.id AS retailerId,
      retailers.slug AS retailerSlug,
      retailers.name AS retailerName,
      retailers.color AS retailerColor,
      prospekt_issues.id AS prospektIssueId,
      prospekt_issues.title AS prospektTitle,
      prospekt_issues.week_scope AS weekScope,
      prospekt_issues.valid_from AS validFrom,
      prospekt_issues.valid_to AS validTo,
      prospekt_issues.source_url AS sourceUrl,
      prospekt_issues.source_type AS sourceType
    FROM offers
    INNER JOIN prospekt_issues ON prospekt_issues.id = offers.prospekt_issue_id
    INNER JOIN retailers ON retailers.id = prospekt_issues.retailer_id
    LEFT JOIN categories ON categories.id = offers.category_id
    ${whereClause}
    ${orderClause}
  `;
}

const DEFAULT_OFFER_ORDER = `
  ORDER BY
    CASE
      WHEN offers.offer_kind = 'coupon' AND offers.price_label IS NOT NULL AND offers.sale_price = 0 THEN 1
      ELSE 0
    END ASC,
    offers.sale_price ASC,
    offers.product_name ASC
`;

// ── Exported query functions ──────────────────────────────────

export async function getDashboardData(weekScope = "current") {
  await ensureInit();
  const selectedWeek = normalizeWeekScope(weekScope);

  const retailers = await all(`
    SELECT
      retailers.id,
      retailers.slug,
      retailers.name,
      retailers.color,
      COUNT(DISTINCT prospekt_issues.id) AS prospektCount,
      COUNT(offers.id) AS offerCount,
      MIN(prospekt_issues.valid_from) AS validFrom,
      MAX(prospekt_issues.valid_to) AS validTo,
      (SELECT pi.source_url FROM prospekt_issues pi WHERE pi.retailer_id = retailers.id AND pi.week_scope = ? LIMIT 1) AS sourceUrl,
      (SELECT pi.asset_path FROM prospekt_issues pi WHERE pi.retailer_id = retailers.id AND pi.week_scope = ? LIMIT 1) AS assetPath,
      (SELECT pi.source_type FROM prospekt_issues pi WHERE pi.retailer_id = retailers.id AND pi.week_scope = ? LIMIT 1) AS sourceType
    FROM retailers
    LEFT JOIN prospekt_issues ON prospekt_issues.retailer_id = retailers.id AND prospekt_issues.week_scope = ?
    LEFT JOIN offers ON offers.prospekt_issue_id = prospekt_issues.id
    GROUP BY retailers.id
    ORDER BY retailers.name
  `, [selectedWeek, selectedWeek, selectedWeek, selectedWeek]);

  const featuredCandidates = await all(
    baseOfferQuery(
      "WHERE offers.review_state = 'approved' AND prospekt_issues.week_scope = ?",
      "ORDER BY offers.original_price DESC, offers.sale_price ASC, offers.product_name ASC LIMIT 120"
    ),
    [selectedWeek]
  );
  const featuredOffers = selectFeaturedOffers(featuredCandidates, 6);

  const emojiBySlug = Object.fromEntries(CATEGORY_DEFINITIONS.map((c) => [c.slug, c.emoji]));
  const categories = (await all(`
    SELECT categories.id, categories.slug, categories.name, categories.tone AS tone, categories.text_color AS textColor, COUNT(offers.id) AS offerCount
    FROM categories
    LEFT JOIN offers ON offers.category_id = categories.id
    LEFT JOIN prospekt_issues ON prospekt_issues.id = offers.prospekt_issue_id
    WHERE prospekt_issues.week_scope = ? OR prospekt_issues.week_scope IS NULL
    GROUP BY categories.id
    ORDER BY categories.name
  `, [selectedWeek])).map((c) => ({ ...c, emoji: emojiBySlug[c.slug] ?? "🛒" }));

  const [prospektRow, offerRow, reviewRow] = await Promise.all([
    get("SELECT COUNT(*) as count FROM prospekt_issues WHERE week_scope = ?", [selectedWeek]),
    get("SELECT COUNT(*) as count FROM offers INNER JOIN prospekt_issues ON prospekt_issues.id = offers.prospekt_issue_id WHERE offers.review_state = 'approved' AND prospekt_issues.week_scope = ?", [selectedWeek]),
    get("SELECT COUNT(*) as count FROM offers INNER JOIN prospekt_issues ON prospekt_issues.id = offers.prospekt_issue_id WHERE offers.review_state != 'approved' AND prospekt_issues.week_scope = ?", [selectedWeek]),
  ]);
  const stats = {
    retailerCount: retailers.length,
    prospektCount: Number(prospektRow?.count ?? 0),
    offerCount: Number(offerRow?.count ?? 0),
    reviewCount: Number(reviewRow?.count ?? 0),
  };

  return { retailers, featuredOffers, categories, stats };
}

export async function listCategories(weekScope = "current") {
  await ensureInit();
  const selectedWeek = normalizeWeekScope(weekScope);
  return all(`
    SELECT categories.id, categories.slug, categories.name, categories.tone AS tone, categories.text_color AS textColor, COUNT(offers.id) AS offerCount
    FROM categories
    LEFT JOIN offers ON offers.category_id = categories.id
    LEFT JOIN prospekt_issues ON prospekt_issues.id = offers.prospekt_issue_id
    WHERE prospekt_issues.week_scope = ? OR prospekt_issues.week_scope IS NULL
    GROUP BY categories.id
    ORDER BY categories.name
  `, [selectedWeek]);
}

export async function listProspekte(weekScope = "current") {
  await ensureInit();
  const selectedWeek = normalizeWeekScope(weekScope);
  return all(`
    SELECT
      prospekt_issues.id,
      prospekt_issues.title,
      prospekt_issues.week_scope AS weekScope,
      prospekt_issues.valid_from AS validFrom,
      prospekt_issues.valid_to AS validTo,
      prospekt_issues.source_url AS sourceUrl,
      prospekt_issues.asset_path AS assetPath,
      prospekt_issues.source_type AS sourceType,
      prospekt_issues.status,
      retailers.slug AS retailerSlug,
      retailers.name AS retailerName,
      retailers.color AS retailerColor,
      COUNT(offers.id) AS offerCount
    FROM prospekt_issues
    INNER JOIN retailers ON retailers.id = prospekt_issues.retailer_id
    LEFT JOIN offers ON offers.prospekt_issue_id = prospekt_issues.id
    WHERE prospekt_issues.week_scope = ?
    GROUP BY prospekt_issues.id
    ORDER BY prospekt_issues.valid_from DESC, retailers.name ASC
  `, [selectedWeek]);
}

export async function listOffers(filters = {}) {
  await ensureInit();
  const conditions = ["offers.review_state = 'approved'", "prospekt_issues.week_scope = ?"];
  const params = [normalizeWeekScope(filters.week)];

  if (filters.retailer) {
    conditions.push("retailers.slug = ?");
    params.push(filters.retailer);
  }
  if (filters.category) {
    conditions.push("categories.slug = ?");
    params.push(filters.category);
  }
  if (filters.search) {
    conditions.push("(LOWER(offers.product_name) LIKE ? OR LOWER(COALESCE(offers.brand, '')) LIKE ?)");
    const search = `%${filters.search.toLowerCase()}%`;
    params.push(search, search);
  }

  let orderClause = DEFAULT_OFFER_ORDER;
  if (filters.sort === "price_desc") {
    orderClause = `
      ORDER BY
        CASE
          WHEN offers.offer_kind = 'coupon' AND offers.price_label IS NOT NULL AND offers.sale_price = 0 THEN 1
          ELSE 0
        END ASC,
        offers.sale_price DESC,
        offers.product_name ASC
    `;
  } else if (filters.sort === "name") {
    orderClause = "ORDER BY offers.product_name ASC";
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  return all(baseOfferQuery(whereClause, orderClause), params);
}

export async function getOfferById(id) {
  await ensureInit();
  return get(baseOfferQuery("WHERE offers.id = ?", ""), [id]);
}

export async function listShoppingItems() {
  await ensureInit();
  const rows = await all(`
    SELECT
      shopping_list_items.id,
      shopping_list_items.quantity,
      shopping_list_items.note,
      shopping_list_items.checked,
      offers.id AS offerId,
      offers.product_name AS productName,
      offers.sale_price AS salePrice,
      offers.image_url AS imageUrl,
      retailers.slug AS retailerSlug,
      retailers.name AS retailerName,
      retailers.color AS retailerColor
    FROM shopping_list_items
    INNER JOIN offers ON offers.id = shopping_list_items.offer_id
    INNER JOIN prospekt_issues ON prospekt_issues.id = offers.prospekt_issue_id
    INNER JOIN retailers ON retailers.id = prospekt_issues.retailer_id
    ORDER BY shopping_list_items.checked ASC, retailers.name ASC, offers.product_name ASC
  `);
  return rows.map((row) => ({
    id: Number(row.id),
    quantity: Number(row.quantity),
    note: row.note ?? "",
    checked: Number(row.checked),
    offerId: Number(row.offerId),
    productName: row.productName,
    salePrice: Number(row.salePrice),
    imageUrl: row.imageUrl ?? null,
    retailerSlug: row.retailerSlug,
    retailerName: row.retailerName,
    retailerColor: row.retailerColor ?? "#2a6b3c",
  }));
}

export async function addShoppingItem(offerId, quantity = 1, note = "") {
  await ensureInit();
  const existing = await get("SELECT id, quantity FROM shopping_list_items WHERE offer_id = ?", [offerId]);
  if (existing) {
    await run(
      "UPDATE shopping_list_items SET quantity = ?, note = COALESCE(NULLIF(?, ''), note) WHERE id = ?",
      [Number(existing.quantity) + quantity, note, existing.id]
    );
    return get("SELECT * FROM shopping_list_items WHERE id = ?", [existing.id]);
  }
  const result = await run(
    "INSERT INTO shopping_list_items (offer_id, quantity, note, checked) VALUES (?, ?, ?, 0)",
    [offerId, quantity, note]
  );
  return get("SELECT * FROM shopping_list_items WHERE id = ?", [Number(result.lastInsertRowid ?? 0)]);
}

export async function updateShoppingItem(id, payload) {
  await ensureInit();
  const existing = await get("SELECT * FROM shopping_list_items WHERE id = ?", [id]);
  if (!existing) return null;
  await run(
    "UPDATE shopping_list_items SET quantity = ?, note = ?, checked = ? WHERE id = ?",
    [payload.quantity ?? existing.quantity, payload.note ?? existing.note, payload.checked ?? existing.checked, id]
  );
  return get("SELECT * FROM shopping_list_items WHERE id = ?", [id]);
}

export async function deleteShoppingItem(id) {
  await ensureInit();
  return run("DELETE FROM shopping_list_items WHERE id = ?", [id]);
}

export async function clearShoppingItems(retailerSlug = null) {
  await ensureInit();
  if (retailerSlug) {
    return run(
      `DELETE FROM shopping_list_items
       WHERE offer_id IN (
         SELECT offers.id FROM offers
         INNER JOIN prospekt_issues ON prospekt_issues.id = offers.prospekt_issue_id
         INNER JOIN retailers ON retailers.id = prospekt_issues.retailer_id
         WHERE retailers.slug = ?
       )`,
      [retailerSlug]
    );
  }
  return run("DELETE FROM shopping_list_items");
}

export async function replaceIssueData(retailerSlug, issue, offers) {
  await ensureInit();
  const retailer = await get("SELECT id FROM retailers WHERE slug = ?", [retailerSlug]);
  if (!retailer) throw new Error(`Unknown retailer ${retailerSlug}`);

  const weekScope = normalizeWeekScope(issue.weekScope);
  const categoryRows = await all("SELECT id, slug FROM categories");
  const categoryMap = Object.fromEntries(categoryRows.map((c) => [c.slug, Number(c.id)]));

  const batchResults = await db.batch([
    { sql: "DELETE FROM offers WHERE prospekt_issue_id IN (SELECT id FROM prospekt_issues WHERE retailer_id = ? AND week_scope = ?)", args: [retailer.id, weekScope] },
    { sql: "DELETE FROM prospekt_issues WHERE retailer_id = ? AND week_scope = ?", args: [retailer.id, weekScope] },
    {
      sql: `INSERT INTO prospekt_issues (retailer_id, title, week_scope, valid_from, valid_to, source_url, asset_path, source_type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [retailer.id, issue.title, weekScope, issue.validFrom, issue.validTo, issue.sourceUrl, issue.assetPath, issue.sourceType, "ready"],
    },
  ], "write");

  const issueId = Number(batchResults[2].lastInsertRowid ?? 0);
  if (!offers.length) return;

  const offerStmts = offers.map((offer) => {
    const categorySlug = categorizeOffer(offer);
    return {
      sql: `INSERT INTO offers
            (prospekt_issue_id, product_name, brand, original_price, sale_price, price_label, offer_kind, unit_info, image_url, product_url, category_id, source_section, confidence_score, review_state)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        issueId, offer.productName, offer.brand ?? null, offer.originalPrice ?? null, offer.salePrice,
        offer.priceLabel ?? null, offer.offerKind ?? "product", offer.unitInfo ?? null,
        offer.imageUrl ?? null, offer.productUrl ?? null, categoryMap[categorySlug] ?? null,
        offer.sourceSection ?? null, offer.confidenceScore ?? 0.5,
        (offer.confidenceScore ?? 0.5) >= 0.75 ? "approved" : "needs_review",
      ],
    };
  });
  await db.batch(offerStmts, "write");
}

export async function reclassifyOffers() {
  await ensureInit();
  const rows = await all("SELECT id, product_name AS productName, source_section AS sourceSection FROM offers");
  const categoryRows = await all("SELECT id, slug FROM categories");
  const categoryMap = Object.fromEntries(categoryRows.map((c) => [c.slug, Number(c.id)]));
  if (!rows.length) return;
  const stmts = rows.map((row) => {
    const categorySlug = categorizeOffer(row);
    return { sql: "UPDATE offers SET category_id = ? WHERE id = ?", args: [categoryMap[categorySlug] ?? null, row.id] };
  });
  await db.batch(stmts, "write");
}

export async function createIngestRun(status, detail = "") {
  await ensureInit();
  const result = await run("INSERT INTO ingest_runs (status, detail) VALUES (?, ?)", [status, detail]);
  return Number(result.lastInsertRowid ?? 0);
}

export async function completeIngestRun(id, status, detail = "") {
  await ensureInit();
  await run("UPDATE ingest_runs SET status = ?, detail = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?", [status, detail, id]);
}

export async function getIngestStatus() {
  await ensureInit();
  const latest = await get(`
    SELECT id, status, detail, started_at AS startedAt, completed_at AS completedAt
    FROM ingest_runs
    ORDER BY id DESC
    LIMIT 1
  `);
  return latest ?? { id: null, status: "idle", detail: "Noch kein Ingest-Lauf ausgeführt.", startedAt: null, completedAt: null };
}

export async function getAppStateValue(key) {
  await ensureInit();
  return (await get("SELECT value FROM app_state WHERE key = ?", [key]))?.value ?? null;
}

export async function setAppStateValue(key, value) {
  await ensureInit();
  await run("INSERT OR REPLACE INTO app_state (key, value) VALUES (?, ?)", [key, String(value)]);
}
