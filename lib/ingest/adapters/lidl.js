import he from "he";
import { getFixtureForWeek } from "../../sample-data.js";

const LIDL_OVERVIEW_URL = "https://www.lidl.de/c/online-prospekte/s10005610";
const LIDL_VIEWER_API = "https://endpoints.leaflets.schwarz/v4/flyer";
const LIDL_BASE_URL = "https://www.lidl.de";

function parseGermanDate(value) {
  const match = value.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  return new Date(`${year}-${month}-${day}T00:00:00+01:00`);
}

function formatIsoDate(value) {
  return value.toISOString().slice(0, 10);
}

function getMonday(date) {
  const monday = new Date(date);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function resolveWeekScopeForDate(date, now = new Date()) {
  const currentWeekStart = getMonday(now);
  const nextWeekStart = new Date(currentWeekStart);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);
  const nextNextWeekStart = new Date(nextWeekStart);
  nextNextWeekStart.setDate(nextNextWeekStart.getDate() + 7);

  if (date >= nextWeekStart && date < nextNextWeekStart) {
    return "next";
  }

  return "current";
}

export function parseLidlOverview(html, now = new Date()) {
  const sectionMatch = html.match(
    /<div class="section-head">Unsere Aktionsprospekte<\/div>[\s\S]*?<div class="subcategory"[\s\S]*?<\/section>/
  );

  if (!sectionMatch) {
    return [];
  }

  const anchorPattern =
    /<a[^>]+href="([^"]+)"[\s\S]*?data-track-id="([^"]+)"[\s\S]*?<div class="flyer__name">\s*([^<]+)\s*<\/div>[\s\S]*?<span class="flyer__title">\s*([^<]+)\s*<\/span>/g;
  const prospects = [];
  let match;

  while ((match = anchorPattern.exec(sectionMatch[0])) !== null) {
    const [, href, flyerId, name, title] = match;
    const dateParts = title.match(/(\d{2}\.\d{2}\.\d{4})\s*[–-]\s*(\d{2}\.\d{2}\.\d{4})/);
    if (!dateParts) {
      continue;
    }

    const validFrom = parseGermanDate(dateParts[1]);
    const validTo = parseGermanDate(dateParts[2]);
    if (!validFrom || !validTo) {
      continue;
    }

    prospects.push({
      flyerId,
      href,
      title: name.trim(),
      dateLabel: title.trim(),
      validFrom: formatIsoDate(validFrom),
      validTo: formatIsoDate(validTo),
      weekScope: resolveWeekScopeForDate(validFrom, now)
    });
  }

  return prospects;
}

function parsePrice(value) {
  if (!value) {
    return null;
  }

  const normalized = String(value).replace(",", ".").replace(/[^\d.]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function cleanText(value = "") {
  return he
    .decode(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveProductUrl(product = {}) {
  return product.url ?? (product.canonicalUrl ? `${LIDL_BASE_URL}${product.canonicalUrl}` : null);
}

function dedupeProducts(productsMap = {}) {
  const seen = new Set();
  const offers = [];

  for (const product of Object.values(productsMap)) {
    const productId = product.productId ?? product.url ?? product.title;
    if (!productId || seen.has(productId)) {
      continue;
    }
    seen.add(productId);

    const salePrice = parsePrice(product.price);
    if (!salePrice) {
      continue;
    }

    offers.push({
      productName: cleanText(product.title),
      brand: cleanText(product.brand ?? "Lidl"),
      salePrice,
      unitInfo: cleanText(product.description ?? ""),
      imageUrl: product.image ?? null,
      productUrl: resolveProductUrl(product),
      sourceSection: cleanText(product.categoryPrimary ?? product.wonCategoryPrimary ?? ""),
      confidenceScore: 0.95
    });
  }

  return offers;
}

async function fetchViewerFlyer(flyerId) {
  const url = new URL(LIDL_VIEWER_API);
  url.searchParams.set("flyer_identifier", flyerId);

  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 AngebotsRadar/0.1"
    },
    next: {
      revalidate: 3600
    }
  });

  if (!response.ok) {
    throw new Error(`Lidl viewer API returned ${response.status}`);
  }

  const payload = await response.json();
  if (!payload?.success || !payload?.flyer) {
    throw new Error("Lidl viewer API did not return flyer data");
  }

  return payload.flyer;
}

export async function fetchLidlProspekt(weekScope = "current") {
  try {
    const response = await fetch(LIDL_OVERVIEW_URL, {
      headers: {
        "user-agent": "Mozilla/5.0 AngebotsRadar/0.1"
      },
      next: {
        revalidate: 3600
      }
    });

    if (!response.ok) {
      throw new Error(`Lidl overview returned ${response.status}`);
    }

    const html = await response.text();
    const prospects = parseLidlOverview(html);
    const selected = prospects.find((item) => item.weekScope === weekScope);

    if (!selected) {
      return getFixtureForWeek("lidl", weekScope);
    }

    const flyer = await fetchViewerFlyer(selected.flyerId);
    const offers = dedupeProducts(flyer.products);

    return {
      issue: {
        title: flyer.name,
        validFrom: flyer.offerStartDate ?? selected.validFrom,
        validTo: flyer.offerEndDate ?? selected.validTo,
        sourceUrl: flyer.flyerUrlAbsolute ?? selected.href,
        assetPath: flyer.pdfUrl ?? flyer.hiResPdfUrl ?? "",
        sourceType: "live-lidl-api",
        weekScope
      },
      offers: offers.length > 0 ? offers : getFixtureForWeek("lidl", weekScope)?.offers ?? []
    };
  } catch (error) {
    console.warn("Falling back to Lidl fixture adapter:", error.message);
    return getFixtureForWeek("lidl", weekScope);
  }
}
