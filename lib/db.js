import { mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { CATEGORY_DEFINITIONS, RETAILERS } from "@/lib/constants";
import { SAMPLE_FIXTURES } from "@/lib/sample-data";
import { categorizeOffer } from "@/lib/classification";

const dataDir = path.join(process.cwd(), ".data");
const dbFile = path.join(dataDir, "angebote-radar.sqlite");

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(dbFile);

function sleep(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function withRetry(callback) {
  let attempt = 0;

  while (attempt < 20) {
    try {
      return callback();
    } catch (error) {
      if (error?.code !== "ERR_SQLITE_ERROR" || error?.errcode !== 5) {
        throw error;
      }

      attempt += 1;
      sleep(100 * attempt);
    }
  }

  return callback();
}

function exec(statement) {
  return withRetry(() => db.exec(statement));
}

function run(statement, params = []) {
  return withRetry(() => db.prepare(statement).run(...params));
}

function get(statement, params = []) {
  return withRetry(() => db.prepare(statement).get(...params));
}

function all(statement, params = []) {
  return withRetry(() => db.prepare(statement).all(...params));
}

function initialize() {
  exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 10000;

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

  try {
    exec("ALTER TABLE prospekt_issues ADD COLUMN week_scope TEXT NOT NULL DEFAULT 'current'");
  } catch (error) {
    if (!String(error.message).includes("duplicate column name")) {
      throw error;
    }
  }

  try {
    exec("ALTER TABLE offers ADD COLUMN image_url TEXT");
  } catch (error) {
    if (!String(error.message).includes("duplicate column name")) {
      throw error;
    }
  }

  try {
    exec("ALTER TABLE offers ADD COLUMN product_url TEXT");
  } catch (error) {
    if (!String(error.message).includes("duplicate column name")) {
      throw error;
    }
  }

  try {
    exec("ALTER TABLE offers ADD COLUMN price_label TEXT");
  } catch (error) {
    if (!String(error.message).includes("duplicate column name")) {
      throw error;
    }
  }

  try {
    exec("ALTER TABLE offers ADD COLUMN offer_kind TEXT NOT NULL DEFAULT 'product'");
  } catch (error) {
    if (!String(error.message).includes("duplicate column name")) {
      throw error;
    }
  }

  syncStaticData();
  cleanupRemovedRetailers();
  seedAllData();
}

function seedAllData() {
  const seeded = get("SELECT value FROM app_state WHERE key = 'fixture_seed_v4'");
  if (seeded?.value === "done") {
    return;
  }

  exec("BEGIN IMMEDIATE");

  try {
    seedFixtures();
    run("INSERT OR REPLACE INTO app_state (key, value) VALUES ('fixture_seed_v4', 'done')");
    exec("COMMIT");
  } catch (error) {
    exec("ROLLBACK");
    throw error;
  }
}

function syncStaticData() {
  {
    const insertRetailer = db.prepare("INSERT OR IGNORE INTO retailers (slug, name, color) VALUES (?, ?, ?)");
    const updateRetailer = db.prepare("UPDATE retailers SET name = ?, color = ? WHERE slug = ?");
    for (const retailer of RETAILERS) {
      insertRetailer.run(retailer.slug, retailer.name, retailer.color);
      updateRetailer.run(retailer.name, retailer.color, retailer.slug);
    }
  }

  {
    const insertCategory = db.prepare("INSERT OR IGNORE INTO categories (slug, name, tone, text_color, parent_id) VALUES (?, ?, ?, ?, NULL)");
    const updateCategory = db.prepare("UPDATE categories SET name = ?, tone = ?, text_color = ? WHERE slug = ?");
    for (const category of CATEGORY_DEFINITIONS) {
      insertCategory.run(category.slug, category.name, category.tone, category.textColor);
      updateCategory.run(category.name, category.tone, category.textColor, category.slug);
    }
  }
}

function seedFixtures() {
  run("DELETE FROM shopping_list_items");
  run("DELETE FROM offers");
  run("DELETE FROM prospekt_issues");

  for (const [retailerSlug, fixturesByWeek] of Object.entries(SAMPLE_FIXTURES)) {
    const retailer = get("SELECT id FROM retailers WHERE slug = ?", [retailerSlug]);

    for (const fixture of Object.values(fixturesByWeek)) {
      const issueResult = run(
        `INSERT OR IGNORE INTO prospekt_issues
         (retailer_id, title, week_scope, valid_from, valid_to, source_url, asset_path, source_type, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ready')`,
        [
          retailer.id,
          fixture.issue.title,
          fixture.issue.weekScope ?? "current",
          fixture.issue.validFrom,
          fixture.issue.validTo,
          fixture.issue.sourceUrl,
          fixture.issue.assetPath,
          fixture.issue.sourceType
        ]
      );

      const issueId =
        issueResult.lastInsertRowid ||
        get(
          "SELECT id FROM prospekt_issues WHERE retailer_id = ? AND title = ? AND week_scope = ? AND valid_from = ? AND valid_to = ?",
          [retailer.id, fixture.issue.title, fixture.issue.weekScope ?? "current", fixture.issue.validFrom, fixture.issue.validTo]
        ).id;

      for (const offer of fixture.offers) {
        const categorySlug = categorizeOffer(offer);
        const category = get("SELECT id FROM categories WHERE slug = ?", [categorySlug]);
        run(
          `INSERT INTO offers
           (prospekt_issue_id, product_name, brand, sale_price, price_label, offer_kind, unit_info, image_url, product_url, category_id, source_section, confidence_score, review_state)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            issueId,
            offer.productName,
            offer.brand,
            offer.salePrice,
            offer.priceLabel ?? null,
            offer.offerKind ?? "product",
            offer.unitInfo ?? null,
            offer.imageUrl ?? null,
            offer.productUrl ?? null,
            category.id,
            offer.sourceSection ?? null,
            offer.confidenceScore ?? 0.5,
            offer.confidenceScore >= 0.75 ? "approved" : "needs_review"
          ]
        );
      }
    }
  }
}

function cleanupRemovedRetailers() {
  const activeSlugs = new Set(RETAILERS.map((retailer) => retailer.slug));
  const staleRetailers = all("SELECT id, slug FROM retailers").filter((retailer) => !activeSlugs.has(retailer.slug));

  for (const retailer of staleRetailers) {
    run("DELETE FROM shopping_list_items WHERE offer_id IN (SELECT id FROM offers WHERE prospekt_issue_id IN (SELECT id FROM prospekt_issues WHERE retailer_id = ?))", [retailer.id]);
    run("DELETE FROM offers WHERE prospekt_issue_id IN (SELECT id FROM prospekt_issues WHERE retailer_id = ?)", [retailer.id]);
    run("DELETE FROM prospekt_issues WHERE retailer_id = ?", [retailer.id]);
    run("DELETE FROM retailers WHERE id = ?", [retailer.id]);
  }
}

initialize();

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

export function getDashboardData(weekScope = "current") {
  const selectedWeek = normalizeWeekScope(weekScope);
  const retailers = all(`
    SELECT
      retailers.id,
      retailers.slug,
      retailers.name,
      retailers.color,
      COUNT(DISTINCT prospekt_issues.id) AS prospektCount,
      COUNT(offers.id) AS offerCount,
      MIN(prospekt_issues.valid_from) AS validFrom,
      MAX(prospekt_issues.valid_to) AS validTo
    FROM retailers
    LEFT JOIN prospekt_issues ON prospekt_issues.retailer_id = retailers.id AND prospekt_issues.week_scope = ?
    LEFT JOIN offers ON offers.prospekt_issue_id = prospekt_issues.id
    GROUP BY retailers.id
    ORDER BY retailers.name
  `, [selectedWeek]);

  const featuredOffers = all(
    baseOfferQuery("WHERE offers.review_state = 'approved' AND prospekt_issues.week_scope = ?", `${DEFAULT_OFFER_ORDER} LIMIT 6`),
    [selectedWeek]
  );
  const categories = all(`
    SELECT categories.id, categories.slug, categories.name, categories.tone AS tone, categories.text_color AS textColor, COUNT(offers.id) AS offerCount
    FROM categories
    LEFT JOIN offers ON offers.category_id = categories.id
    LEFT JOIN prospekt_issues ON prospekt_issues.id = offers.prospekt_issue_id
    WHERE prospekt_issues.week_scope = ? OR prospekt_issues.week_scope IS NULL
    GROUP BY categories.id
    ORDER BY categories.name
  `, [selectedWeek]);

  const stats = {
    retailerCount: retailers.length,
    prospektCount: get("SELECT COUNT(*) as count FROM prospekt_issues WHERE week_scope = ?", [selectedWeek]).count,
    offerCount: get("SELECT COUNT(*) as count FROM offers INNER JOIN prospekt_issues ON prospekt_issues.id = offers.prospekt_issue_id WHERE offers.review_state = 'approved' AND prospekt_issues.week_scope = ?", [selectedWeek]).count,
    reviewCount: get("SELECT COUNT(*) as count FROM offers INNER JOIN prospekt_issues ON prospekt_issues.id = offers.prospekt_issue_id WHERE offers.review_state != 'approved' AND prospekt_issues.week_scope = ?", [selectedWeek]).count
  };

  return { retailers, featuredOffers, categories, stats };
}

export function listCategories(weekScope = "current") {
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

export function listProspekte(weekScope = "current") {
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

export function listOffers(filters = {}) {
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
  if (filters.sort === "price_asc") {
    orderClause = `${DEFAULT_OFFER_ORDER}`;
  } else if (filters.sort === "price_desc") {
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

export function getOfferById(id) {
  return get(baseOfferQuery("WHERE offers.id = ?", ""), [id]);
}

export function listShoppingItems() {
  return all(`
    SELECT
      shopping_list_items.id,
      shopping_list_items.quantity,
      shopping_list_items.note,
      shopping_list_items.checked,
      offers.id AS offerId,
      offers.product_name AS productName,
      offers.sale_price AS salePrice,
      retailers.slug AS retailerSlug,
      retailers.name AS retailerName
    FROM shopping_list_items
    INNER JOIN offers ON offers.id = shopping_list_items.offer_id
    INNER JOIN prospekt_issues ON prospekt_issues.id = offers.prospekt_issue_id
    INNER JOIN retailers ON retailers.id = prospekt_issues.retailer_id
    ORDER BY shopping_list_items.checked ASC, retailers.name ASC, offers.product_name ASC
  `);
}

export function addShoppingItem(offerId, quantity = 1, note = "") {
  const existing = get("SELECT id, quantity FROM shopping_list_items WHERE offer_id = ?", [offerId]);
  if (existing) {
    run("UPDATE shopping_list_items SET quantity = ?, note = COALESCE(NULLIF(?, ''), note) WHERE id = ?", [
      existing.quantity + quantity,
      note,
      existing.id
    ]);
    return get("SELECT * FROM shopping_list_items WHERE id = ?", [existing.id]);
  }

  const result = run("INSERT INTO shopping_list_items (offer_id, quantity, note, checked) VALUES (?, ?, ?, 0)", [
    offerId,
    quantity,
    note
  ]);
  return get("SELECT * FROM shopping_list_items WHERE id = ?", [result.lastInsertRowid]);
}

export function updateShoppingItem(id, payload) {
  const existing = get("SELECT * FROM shopping_list_items WHERE id = ?", [id]);
  if (!existing) {
    return null;
  }

  run(
    "UPDATE shopping_list_items SET quantity = ?, note = ?, checked = ? WHERE id = ?",
    [
      payload.quantity ?? existing.quantity,
      payload.note ?? existing.note,
      payload.checked ?? existing.checked,
      id
    ]
  );

  return get("SELECT * FROM shopping_list_items WHERE id = ?", [id]);
}

export function deleteShoppingItem(id) {
  return run("DELETE FROM shopping_list_items WHERE id = ?", [id]);
}

export function replaceIssueData(retailerSlug, issue, offers) {
  const retailer = get("SELECT id FROM retailers WHERE slug = ?", [retailerSlug]);
  if (!retailer) {
    throw new Error(`Unknown retailer ${retailerSlug}`);
  }

  const weekScope = normalizeWeekScope(issue.weekScope);
  run("DELETE FROM offers WHERE prospekt_issue_id IN (SELECT id FROM prospekt_issues WHERE retailer_id = ? AND week_scope = ?)", [retailer.id, weekScope]);
  run("DELETE FROM prospekt_issues WHERE retailer_id = ? AND week_scope = ?", [retailer.id, weekScope]);

  const insertedIssue = run(
    `INSERT INTO prospekt_issues
    (retailer_id, title, week_scope, valid_from, valid_to, source_url, asset_path, source_type, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [retailer.id, issue.title, weekScope, issue.validFrom, issue.validTo, issue.sourceUrl, issue.assetPath, issue.sourceType, "ready"]
  );

  for (const offer of offers) {
    const categorySlug = categorizeOffer(offer);
    const category = get("SELECT id FROM categories WHERE slug = ?", [categorySlug]);
    run(
      `INSERT INTO offers
       (prospekt_issue_id, product_name, brand, original_price, sale_price, price_label, offer_kind, unit_info, image_url, product_url, category_id, source_section, confidence_score, review_state)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        insertedIssue.lastInsertRowid,
        offer.productName,
        offer.brand ?? null,
        offer.originalPrice ?? null,
        offer.salePrice,
        offer.priceLabel ?? null,
        offer.offerKind ?? "product",
        offer.unitInfo ?? null,
        offer.imageUrl ?? null,
        offer.productUrl ?? null,
        category.id,
        offer.sourceSection ?? null,
        offer.confidenceScore ?? 0.5,
        offer.confidenceScore >= 0.75 ? "approved" : "needs_review"
      ]
    );
  }
}

export function createIngestRun(status, detail = "") {
  const result = run("INSERT INTO ingest_runs (status, detail) VALUES (?, ?)", [status, detail]);
  return result.lastInsertRowid;
}

export function completeIngestRun(id, status, detail = "") {
  run("UPDATE ingest_runs SET status = ?, detail = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?", [status, detail, id]);
}

export function getIngestStatus() {
  const latest = get(`
    SELECT id, status, detail, started_at AS startedAt, completed_at AS completedAt
    FROM ingest_runs
    ORDER BY id DESC
    LIMIT 1
  `);

  return latest ?? {
    id: null,
    status: "idle",
    detail: "Noch kein Ingest-Lauf ausgeführt.",
    startedAt: null,
    completedAt: null
  };
}

export function getAppStateValue(key) {
  return get("SELECT value FROM app_state WHERE key = ?", [key])?.value ?? null;
}

export function setAppStateValue(key, value) {
  run("INSERT OR REPLACE INTO app_state (key, value) VALUES (?, ?)", [key, String(value)]);
}
