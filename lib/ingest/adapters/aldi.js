import he from "he";
import { getFixtureForWeek } from "@/lib/sample-data";

const ALDI_BASE_URL = "https://www.aldi-sued.de";
const ALDI_PROSPEKTE_URL = `${ALDI_BASE_URL}/prospekte`;

function getMonday(date) {
  const monday = new Date(date);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function addDays(date, days) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function formatIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function cleanText(value = "") {
  return he
    .decode(String(value))
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(value) {
  if (!value) {
    return null;
  }

  return he.decode(value).replace(/&amp;/g, "&");
}

function absoluteUrl(baseUrl, value) {
  const normalized = normalizeUrl(value);
  if (!normalized) {
    return null;
  }

  try {
    return new URL(normalized, baseUrl).toString();
  } catch {
    return normalized;
  }
}

function parsePrice(value) {
  const normalized = cleanText(value).replace(",", ".").replace(/[^\d.]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseProspektTeasers(html) {
  const teaserPattern =
    /<div class="cms-multilayout-teaser"[\s\S]*?<img class="base-image base-picture__img" src="([^"]+)"[\s\S]*?<p class="cms-multilayout-teaser__title">([^<]+)<\/p>[\s\S]*?<a href="([^"]+)" class="base-link[^"]*cms-multilayout-teaser__link"/g;
  const prospects = [];
  let match;

  while ((match = teaserPattern.exec(html)) !== null) {
    const [, imageUrl, title, href] = match;
    const normalizedHref = normalizeUrl(href);
    if (!normalizedHref?.includes("prospekt.aldi-sued.de")) {
      continue;
    }

    const normalizedTitle = cleanText(title);
    let weekScope = null;
    if (/aktuellen Woche/i.test(normalizedTitle)) {
      weekScope = "current";
    } else if (/nächsten Woche/i.test(normalizedTitle)) {
      weekScope = "next";
    }

    if (!weekScope) {
      continue;
    }

    prospects.push({
      title: normalizedTitle,
      href: normalizedHref,
      imageUrl: normalizeUrl(imageUrl),
      weekScope
    });
  }

  return prospects;
}

function parseAldiOffersPage(html) {
  const tilePattern =
    /<div id="product-tile-([^"]+)" class="product-teaser-item[\s\S]*?<a href="([^"]+)" class="base-link product-tile__link[\s\S]*?<img class="base-image"[\s\S]*?src="([^"]+)" alt="([^"]*)"[\s\S]*?<div class="product-tile__brandname"[\s\S]*?<p[^>]*>([^<]*)<\/p>[\s\S]*?<div class="product-tile__name"[\s\S]*?<p[^>]*>([^<]*)<\/p>[\s\S]*?<div data-test="product-tile__unit-of-measurement"[^>]*>([\s\S]*?)<\/div>[\s\S]*?<div data-test="product-tile__comparison-price"[^>]*>([\s\S]*?)<\/div>[\s\S]*?<div class="base-price base-price--product-tile"[\s\S]*?<span class="base-price__regular"><span>([^<]+)<\/span>/g;
  const seen = new Set();
  const offers = [];
  let match;

  while ((match = tilePattern.exec(html)) !== null) {
    const [, tileId, href, imageUrl, imageAlt, brand, productName, unitMarkup, comparisonMarkup, priceLabel] = match;
    const dedupeKey = tileId || href;
    if (!dedupeKey || seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);

    const salePrice = parsePrice(priceLabel);
    if (salePrice == null) {
      continue;
    }

    const unitInfo = [cleanText(unitMarkup), cleanText(comparisonMarkup)].filter(Boolean).join(" · ");

    offers.push({
      productName: cleanText(productName || imageAlt),
      brand: cleanText(brand || "ALDI"),
      salePrice,
      unitInfo,
      imageUrl: normalizeUrl(imageUrl),
      productUrl: `${ALDI_BASE_URL}${normalizeUrl(href)}`,
      sourceSection: "",
      confidenceScore: 0.95
    });
  }

  return offers;
}

function buildAldiProspektDataUrl(prospektUrl) {
  return `${prospektUrl.replace(/\/+$/, "")}/data.json`;
}

function buildAldiHotspotsUrl(prospektUrl, pageNumber, cacheToken) {
  const base = prospektUrl.replace(/\/+$/, "");
  return `${base}/page/${pageNumber}/hotspots_data.json?version=${encodeURIComponent(cacheToken)}`;
}

function parseAldiProspektProducts(hotspots = [], prospektUrl) {
  const offers = [];
  const seen = new Set();

  for (const hotspot of hotspots) {
    if (!["product", "dynamicProduct", "generatedProduct"].includes(hotspot?.type)) {
      continue;
    }

    const products = Array.isArray(hotspot.products) ? hotspot.products : [];
    for (const product of products) {
      const productName = cleanText(product.title);
      const salePrice = parsePrice(product.price);
      if (!productName || salePrice == null) {
        continue;
      }

      const dedupeKey = product.webshopIdentifier || `${productName}:${salePrice}`;
      if (seen.has(dedupeKey)) {
        continue;
      }
      seen.add(dedupeKey);

      offers.push({
        productName,
        brand: cleanText(product.brand || "ALDI"),
        salePrice,
        unitInfo: cleanText(product.description || product.productType || ""),
        imageUrl: absoluteUrl(prospektUrl, product.photoUrls?.[0]?.thumb || hotspot.coverImageUrls?.["400"]),
        productUrl: null,
        sourceSection: cleanText(product.productType || ""),
        confidenceScore: 0.96
      });
    }
  }

  return offers;
}

async function fetchAldiProspektOffers(issue) {
  const prospektUrl = issue.sourceUrl;
  const dataJson = await fetchHtml(buildAldiProspektDataUrl(prospektUrl)).then((response) => JSON.parse(response));
  const numPages = Number(dataJson?.numPages);
  const cacheToken = cleanText(dataJson?.cacheToken);

  if (!Number.isFinite(numPages) || numPages < 1 || !cacheToken) {
    return [];
  }

  const hotspots = [];
  for (let pageNumber = 1; pageNumber <= numPages; pageNumber += 1) {
    const url = buildAldiHotspotsUrl(prospektUrl, pageNumber, cacheToken);
    const pageHotspots = await fetchHtml(url).then((response) => JSON.parse(response));
    if (Array.isArray(pageHotspots) && pageHotspots.length > 0) {
      hotspots.push(...pageHotspots);
    }
  }

  return parseAldiProspektProducts(hotspots, prospektUrl);
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 AngebotsRadar/0.1"
    },
    next: {
      revalidate: 3600
    }
  });

  if (!response.ok) {
    throw new Error(`ALDI request failed with ${response.status} for ${url}`);
  }

  return response.text();
}

function buildIssueFromProspekt(prospekt, weekScope, now = new Date()) {
  const weekStart = addDays(getMonday(now), weekScope === "next" ? 7 : 0);
  const validFrom = formatIsoDate(weekStart);
  const validTo = formatIsoDate(addDays(weekStart, 6));
  const offersUrl = `${ALDI_BASE_URL}/angebote/${validFrom}`;

  return {
    title: prospekt.title,
    validFrom,
    validTo,
    sourceUrl: prospekt.href,
    assetPath: prospekt.imageUrl ?? "",
    sourceType: "live-aldi-page",
    weekScope,
    offersUrl
  };
}

export async function fetchAldiProspekt(weekScope = "current") {
  try {
    const prospekteHtml = await fetchHtml(ALDI_PROSPEKTE_URL);
    const prospects = parseProspektTeasers(prospekteHtml);
    const selected = prospects.find((item) => item.weekScope === weekScope);

    if (!selected) {
      return getFixtureForWeek("aldi", weekScope);
    }

    const issue = buildIssueFromProspekt(selected, weekScope);
    let offers = await fetchAldiProspektOffers(issue);

    if (offers.length === 0) {
      const offersHtml = await fetchHtml(issue.offersUrl);
      offers = parseAldiOffersPage(offersHtml);
    }

    return {
      issue: {
        title: issue.title,
        validFrom: issue.validFrom,
        validTo: issue.validTo,
        sourceUrl: issue.sourceUrl,
        assetPath: issue.assetPath,
        sourceType: issue.sourceType,
        weekScope
      },
      offers: offers.length > 0 ? offers : getFixtureForWeek("aldi", weekScope)?.offers ?? []
    };
  } catch (error) {
    console.warn("Falling back to ALDI fixture adapter:", error.message);
    return getFixtureForWeek("aldi", weekScope);
  }
}
