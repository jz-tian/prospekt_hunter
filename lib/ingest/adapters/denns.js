import he from "he";

const DENNS_BASE_URL = "https://www.biomarkt.de";
const DENNS_DEFAULT_MARKET_SLUG = process.env.DENNS_MARKET_SLUG?.trim() || "muenchen-regerstr";

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

  return he.decode(String(value)).replace(/&amp;/g, "&");
}

function absoluteUrl(value, baseUrl = DENNS_BASE_URL) {
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
  const match = cleanText(value).match(/(\d+[.,]\d{2})/);
  if (!match) {
    return null;
  }

  const parsed = Number(match[1].replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function getDennsWeekStart(date) {
  const value = new Date(date);
  const day = value.getDay();
  const diff = (day + 4) % 7;
  value.setDate(value.getDate() - diff);
  value.setHours(0, 0, 0, 0);
  return value;
}

function parseIsoDate(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${cleanText(value)}T00:00:00+01:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function overlapsRange(startA, endA, startB, endB) {
  return startA <= endB && startB <= endA;
}

function buildMarketUrls(marketSlug = DENNS_DEFAULT_MARKET_SLUG) {
  const normalizedSlug = cleanText(marketSlug).replace(/^\/+|\/+$/g, "");
  const offersPath = `${normalizedSlug}/angebote`;

  return {
    marketSlug: normalizedSlug,
    sourceUrl: absoluteUrl(offersPath),
    pageDataUrl: absoluteUrl(`page-data/${offersPath}/page-data.json`)
  };
}

export function resolveWeekScopeForDate(date, now = new Date()) {
  const nextWeekStart = addDays(getDennsWeekStart(now), 7);
  return date >= nextWeekStart ? "next" : "current";
}

function resolveSegment(weekScope = "current", now = new Date()) {
  const start = addDays(getDennsWeekStart(now), weekScope === "next" ? 7 : 0);
  return {
    weekScope,
    start,
    end: addDays(start, 6)
  };
}

function resolveCampaignEnd(payload, segment) {
  return parseIsoDate(payload?.result?.pageContext?.campaignEnd) ?? segment.end;
}

function findProspektUrl(offerHandouts = [], segment) {
  for (const handoutGroup of offerHandouts) {
    const ranges = Array.isArray(handoutGroup.offerRanges) ? handoutGroup.offerRanges : [];

    for (const range of ranges) {
      const [rangeStartRaw, rangeEndRaw] = Array.isArray(range.range) ? range.range : [];
      const rangeStart = parseIsoDate(rangeStartRaw);
      const rangeEnd = parseIsoDate(rangeEndRaw);
      if (!rangeStart || !rangeEnd || !overlapsRange(segment.start, segment.end, rangeStart, rangeEnd)) {
        continue;
      }

      const url =
        range?.DeOfferHandouts?.dennsTwelvePagerCustomLink ??
        range?.DeOfferHandouts?.twelvePagerMvpCustomLink ??
        range?.DeOfferHandouts?.twelvePagerOvpCustomLink;
      if (url) {
        return absoluteUrl(url);
      }
    }
  }

  return null;
}

function resolveApplicablePrice(offer, segment) {
  const validFrom = parseIsoDate(offer.validfrom);
  const validTo = parseIsoDate(offer.validto);
  const appValidFrom = parseIsoDate(offer.appValidfrom);
  const appValidTo = parseIsoDate(offer.appValidto);
  const appOverlaps = appValidFrom && appValidTo ? overlapsRange(segment.start, segment.end, appValidFrom, appValidTo) : false;
  const baseOverlaps = validFrom && validTo ? overlapsRange(segment.start, segment.end, validFrom, validTo) : false;

  const appPrice = parsePrice(offer.priceApp);
  const basePrice = parsePrice(offer.price);
  const strikePrice = parsePrice(offer.priceb);

  if (appOverlaps && appPrice) {
    return {
      salePrice: appPrice,
      originalPrice: strikePrice ?? basePrice,
      active: true
    };
  }

  if (baseOverlaps && basePrice) {
    return {
      salePrice: basePrice,
      originalPrice: strikePrice,
      active: true
    };
  }

  if (baseOverlaps && appPrice) {
    return {
      salePrice: appPrice,
      originalPrice: strikePrice ?? basePrice,
      active: true
    };
  }

  return {
    salePrice: null,
    originalPrice: null,
    active: false
  };
}

function extractPriceLabel(offer) {
  const title = cleanText(offer.title);
  const titleDiscountMatch = title.match(/(\d+\s?%)\s*Rabatt/i);
  if (titleDiscountMatch) {
    return `${titleDiscountMatch[1].replace(/\s+/g, " ")} Rabatt`;
  }

  const discount = cleanText(offer.discount);
  const discountType = cleanText(offer.discountType);
  if (discount && discountType === "04") {
    return `${discount.replace(".", ",")} % Rabatt`;
  }

  return null;
}

function resolveOfficialPagePrice(offer) {
  const appPrice = parsePrice(offer.priceApp || offer.priceCoupon);
  const basePrice = parsePrice(offer.price || offer.priceOffer);
  const originalPrice = parsePrice(offer.priceb || offer.priceInitial);

  if (appPrice) {
    return {
      salePrice: appPrice,
      originalPrice: originalPrice ?? basePrice,
      active: true,
      priceLabel: null,
      displayMode: "app"
    };
  }

  if (basePrice) {
    return {
      salePrice: basePrice,
      originalPrice,
      active: true,
      priceLabel: null,
      displayMode: "base"
    };
  }

  const priceLabel = extractPriceLabel(offer);
  if (priceLabel) {
    return {
      salePrice: 0,
      originalPrice: null,
      active: true,
      priceLabel,
      displayMode: "label"
    };
  }

  return {
    salePrice: null,
    originalPrice: null,
    active: false,
    priceLabel: null,
    displayMode: null
  };
}

function buildUnitInfo(offer, segment, priceMode = "base") {
  const parts = [];

  if (cleanText(offer.subtitle)) {
    parts.push(cleanText(offer.subtitle));
  }

  if (cleanText(offer.pricec)) {
    parts.push(cleanText(offer.pricec));
  }

  if (cleanText(offer.deposit)) {
    parts.push(cleanText(offer.deposit));
  }

  const appValidFrom = parseIsoDate(offer.appValidfrom);
  const appValidTo = parseIsoDate(offer.appValidto);
  if (
    cleanText(offer.priceAppKilo) &&
    (priceMode === "app" || (appValidFrom && appValidTo && overlapsRange(segment.start, segment.end, appValidFrom, appValidTo)))
  ) {
    parts.push(cleanText(offer.priceAppKilo));
  }

  return parts.filter(Boolean).join(" · ");
}

function isVisibleOnOfficialCurrentPage(offer, now, campaignEnd) {
  const publishAt = parseIsoDate(offer.publishAt);
  const validFrom = parseIsoDate(offer.validfrom);
  const validTo = parseIsoDate(offer.validto);

  if (publishAt && publishAt > now) {
    return false;
  }

  if (!validFrom || !validTo) {
    return true;
  }

  return overlapsRange(validFrom, validTo, getDennsWeekStart(now), campaignEnd);
}

function isRelevantForWeekScope(offer, weekScope, now, campaignEnd) {
  if (weekScope === "current") {
    return isVisibleOnOfficialCurrentPage(offer, now, campaignEnd);
  }

  const segment = resolveSegment(weekScope, now);
  const validFrom = parseIsoDate(offer.validfrom);
  const validTo = parseIsoDate(offer.validto);
  const appValidFrom = parseIsoDate(offer.appValidfrom);
  const appValidTo = parseIsoDate(offer.appValidto);

  if (appValidFrom && appValidTo && overlapsRange(segment.start, segment.end, appValidFrom, appValidTo)) {
    return true;
  }

  if (validFrom && validTo && overlapsRange(segment.start, segment.end, validFrom, validTo)) {
    return true;
  }

  return false;
}

function resolveOfferPrice(offer, weekScope, segment) {
  if (weekScope === "current") {
    return resolveOfficialPagePrice(offer);
  }

  const applicable = resolveApplicablePrice(offer, segment);
  return {
    ...applicable,
    priceLabel: null,
    displayMode: applicable.salePrice && parsePrice(offer.priceApp) === applicable.salePrice ? "app" : "base"
  };
}

export function parseDennsPageData(payload, weekScope = "current", now = new Date(), marketSlug = DENNS_DEFAULT_MARKET_SLUG) {
  const segment = resolveSegment(weekScope, now);
  const urls = buildMarketUrls(marketSlug);
  const market = payload?.result?.data?.sanityMarketData;
  const offers = payload?.result?.data?.sanityAllOffers?.nodes;
  const offerHandouts = payload?.result?.pageContext?.offerHandouts;
  const campaignEnd = resolveCampaignEnd(payload, segment);

  if (!market || !Array.isArray(offers)) {
    return null;
  }

  const mappedOffers = [];
  const seen = new Set();

  for (const offer of offers) {
    if (offer?.hidden) {
      continue;
    }

    if (!isRelevantForWeekScope(offer, weekScope, now, campaignEnd)) {
      continue;
    }

    const price = resolveOfferPrice(offer, weekScope, segment);
    if (!price.active || (price.salePrice == null && !price.priceLabel)) {
      continue;
    }

    const productName = cleanText(offer.title);
    if (!productName) {
      continue;
    }

    const dedupeKey = offer._id || `${productName}:${price.salePrice ?? price.priceLabel}:${offer.validfrom}:${offer.appValidfrom || ""}`;
    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);

    mappedOffers.push({
      productName,
      brand: cleanText(offer.brand) || null,
      originalPrice: price.originalPrice,
      salePrice: price.salePrice,
      unitInfo: buildUnitInfo(offer, segment, price.displayMode) || null,
      imageUrl: absoluteUrl(offer.offerImage?.image?.asset?.url || offer.image),
      productUrl: urls.sourceUrl,
      sourceSection: cleanText(offer.articleGroup?.productGroup?.title) || "",
      confidenceScore: 0.96,
      priceLabel: price.priceLabel,
      offerKind: price.priceLabel ? "coupon" : "product"
    });
  }

  const titleMarketName = cleanText(market.name || "Denns BioMarkt");
  const validFrom =
    weekScope === "current"
      ? formatIsoDate(segment.start)
      : formatIsoDate(segment.start);
  const validTo =
    weekScope === "current"
      ? formatIsoDate(campaignEnd)
      : formatIsoDate(segment.end);

  return {
    issue: {
      title: `${titleMarketName} Angebote`,
      validFrom,
      validTo,
      sourceUrl: urls.sourceUrl,
      assetPath: findProspektUrl(offerHandouts, segment),
      sourceType: "live-denns-page-data",
      weekScope
    },
    offers: mappedOffers
  };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 AngebotsRadar/0.1",
      accept: "application/json,text/plain,*/*",
      "accept-language": "de-DE,de;q=0.9,en;q=0.8"
    },
    next: {
      revalidate: 3600
    }
  });

  if (!response.ok) {
    throw new Error(`Denns request failed with ${response.status} for ${url}`);
  }

  return response.json();
}

export async function fetchDennsProspekt(weekScope = "current", now = new Date()) {
  const urls = buildMarketUrls();
  const payload = await fetchJson(urls.pageDataUrl);
  const parsed = parseDennsPageData(payload, weekScope, now, urls.marketSlug);

  if (!parsed || parsed.offers.length === 0) {
    throw new Error("No Denns offers found in official page-data");
  }

  return parsed;
}
