import he from "he";
import { getFixtureForWeek } from "../../sample-data.js";

const EDEKA_BASE_URL = "https://www.edeka.de";
const EDEKA_DEFAULT_MARKET_ID = process.env.EDEKA_MARKET_ID?.trim() || "10003350";

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

function parsePrice(value) {
  const match = cleanText(value).match(/(\d+[.,]\d{2})/);
  if (!match) {
    return null;
  }

  const parsed = Number(match[1].replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseGermanDate(value) {
  const match = cleanText(value).match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  return new Date(`${year}-${month}-${day}T00:00:00+01:00`);
}

function formatIsoDate(value) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildCatalogueXmlUrl(catalogueUrl) {
  if (!catalogueUrl) {
    return null;
  }

  const normalized = normalizeUrl(catalogueUrl);
  if (!normalized) {
    return null;
  }

  return normalized.replace(/\/index\.html(?:\?.*)?$/i, "/blaetterkatalog/xml/catalog.xml");
}

function getSunday(date) {
  const sunday = new Date(date);
  const day = sunday.getDay();
  sunday.setDate(sunday.getDate() - day);
  sunday.setHours(0, 0, 0, 0);
  return sunday;
}

export function resolveWeekScopeForDate(date, now = new Date()) {
  const currentWeekStart = getSunday(now);
  const nextWeekStart = new Date(currentWeekStart);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);
  const nextNextWeekStart = new Date(nextWeekStart);
  nextNextWeekStart.setDate(nextNextWeekStart.getDate() + 7);

  if (date >= nextWeekStart && date < nextNextWeekStart) {
    return "next";
  }

  return "current";
}

export function parseEdekaProspektPage(html, now = new Date()) {
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!nextDataMatch) {
    return null;
  }

  const payload = JSON.parse(nextDataMatch[1]);
  const market = payload?.props?.pageProps?.market;
  const catalogue = market?.catalogue ?? payload?.props?.pageProps?.catalogue;
  if (!market || !catalogue?.url || !catalogue?.validFrom || !catalogue?.validTo) {
    return null;
  }

  const validFromDate = new Date(catalogue.validFrom);
  const validToDate = new Date(catalogue.validTo);

  return {
    marketId: String(market.id ?? payload?.query?.marketId ?? EDEKA_DEFAULT_MARKET_ID),
    marketName: cleanText(market.name || "EDEKA"),
    marketUrl: normalizeUrl(market.url),
    offerUrl: normalizeUrl(market.offerUrl),
    title: `${cleanText(market.name || "EDEKA")} Angebote der Woche`,
    validFrom: formatIsoDate(validFromDate),
    validTo: formatIsoDate(validToDate),
    sourceUrl: normalizeUrl(`${EDEKA_BASE_URL}/markt-id/${market.id ?? payload?.query?.marketId}/prospekt.jsp`),
    assetPath: normalizeUrl(catalogue.previewUrl),
    catalogueUrl: normalizeUrl(catalogue.url),
    specials: Array.isArray(catalogue.specials) ? catalogue.specials : [],
    weekScope: resolveWeekScopeForDate(validFromDate, now)
  };
}

export function parseEdekaCatalogueXml(xml, now = new Date()) {
  const fromMatch = xml.match(/<valid>\s*<from>([^<]+)<\/from>/);
  const toMatch = xml.match(/<valid>\s*<from>[^<]+<\/from>\s*<to>([^<]+)<\/to>/);
  const pageCountMatch = xml.match(/<range[^>]+pages="(\d+)"/);

  const validFromDate = fromMatch ? new Date(`${cleanText(fromMatch[1])}T00:00:00+01:00`) : null;
  const validToDate = toMatch ? new Date(`${cleanText(toMatch[1])}T00:00:00+01:00`) : null;

  if (!validFromDate || !validToDate || Number.isNaN(validFromDate.getTime()) || Number.isNaN(validToDate.getTime())) {
    return null;
  }

  return {
    validFrom: formatIsoDate(validFromDate),
    validTo: formatIsoDate(validToDate),
    pageCount: pageCountMatch ? Number(pageCountMatch[1]) : null,
    weekScope: resolveWeekScopeForDate(validFromDate, now)
  };
}

export function parseEdekaOffersPage(html) {
  const sectionPattern = /<li id="([^"]+)" data-on-page-navigation-title="([^"]+)"[\s\S]*?(?=<li id="[^"]+" data-on-page-navigation-title=|<\/filter-controller>)/g;
  const itemPattern = /<li id="filter-results-item-[^"]+"[\s\S]*?<article[\s\S]*?<\/article>/g;
  const offers = [];
  const seen = new Set();
  let sectionMatch;

  while ((sectionMatch = sectionPattern.exec(html)) !== null) {
    const [sectionMarkup, sectionId, sectionTitle] = sectionMatch;
    const sourceSection = cleanText(sectionTitle || sectionId);
    const itemMarkup = sectionMarkup.match(itemPattern) ?? [];

    for (const articleMarkup of itemMarkup) {
      const titleMatch = articleMarkup.match(
        /<a href="#angebot-[^"]+"[^>]*>[\s\S]*?<span class="sr-only">Angebot:<\/span>\s*([^<]+)\s*<\/a>/
      );
      const priceMatch = articleMarkup.match(/<div class="sr-only">([^<]+)<\/div>/);
      const descriptionMatch = articleMarkup.match(/<p class="line-clamp-2">\s*([\s\S]*?)<\/p>/);
      const imageMatch = articleMarkup.match(/<img src="([^"]+)"/);
      const validityMatch = articleMarkup.match(/<strong class="text-sm text-grey[^"]*">\s*([^<]+)\s*<\/strong>/);

      const productName = cleanText(titleMatch?.[1]);
      const salePrice = parsePrice(priceMatch?.[1]);
      if (!productName || !salePrice) {
        continue;
      }

      const dedupeKey = `${sourceSection}::${productName}::${salePrice}`;
      if (seen.has(dedupeKey)) {
        continue;
      }
      seen.add(dedupeKey);

      // EDEKA sr-only: "Rabattierter Preis von X.XX € (Insgesamt -N % Rabatt)"
      // No absolute original price is published; back-calculate from discount percentage.
      const discountPctMatch = (priceMatch?.[1] ?? "").match(/Insgesamt\s*-(\d+)\s*%\s*Rabatt/i);
      const discountPct = discountPctMatch ? Number(discountPctMatch[1]) : null;
      const originalPrice =
        discountPct && discountPct > 0 && discountPct < 100
          ? Math.round((salePrice / (1 - discountPct / 100)) * 100) / 100
          : null;

      const description = cleanText(descriptionMatch?.[1]);
      const validityLabel = cleanText(validityMatch?.[1]);
      const unitInfo = [description, validityLabel].filter(Boolean).join(" · ");

      offers.push({
        productName,
        brand: null,
        salePrice,
        ...(originalPrice ? { originalPrice } : {}),
        unitInfo,
        imageUrl: normalizeUrl(imageMatch?.[1]),
        productUrl: null,
        sourceSection,
        confidenceScore: 0.92
      });
    }
  }

  return offers;
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 AngebotsRadar/0.1",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "de-DE,de;q=0.9,en;q=0.8",
      referer: EDEKA_BASE_URL
    },
    next: { revalidate: 3600 }
  });

  if (!response.ok) {
    throw new Error(`EDEKA request failed with ${response.status} for ${url}`);
  }

  return response.text();
}

function buildProspektUrl(marketId) {
  return `${EDEKA_BASE_URL}/markt-id/${marketId}/prospekt.jsp`;
}

async function resolveIssueCandidates(issue, now = new Date()) {
  const candidates = [];
  const seen = new Set();

  const addCandidate = async ({ title, sourceUrl, assetPath }) => {
    const xmlUrl = buildCatalogueXmlUrl(sourceUrl);
    if (!xmlUrl || seen.has(xmlUrl)) {
      return;
    }
    seen.add(xmlUrl);

    try {
      const xml = await fetchHtml(xmlUrl);
      const catalogue = parseEdekaCatalogueXml(xml, now);
      if (!catalogue) {
        return;
      }

      candidates.push({
        title,
        sourceUrl,
        assetPath,
        validFrom: catalogue.validFrom,
        validTo: catalogue.validTo,
        weekScope: catalogue.weekScope,
        pageCount: catalogue.pageCount
      });
    } catch (error) {
      console.warn("Unable to resolve EDEKA catalogue candidate:", error.message);
    }
  };

  await addCandidate({
    title: issue.title,
    sourceUrl: issue.catalogueUrl,
    assetPath: issue.assetPath
  });

  for (const special of issue.specials ?? []) {
    await addCandidate({
      title: cleanText(special.name || "EDEKA Spezialprospekt"),
      sourceUrl: normalizeUrl(special.url),
      assetPath: null
    });
  }

  return candidates;
}

export async function fetchEdekaProspekt(weekScope = "current") {
  try {
    const prospektHtml = await fetchHtml(buildProspektUrl(EDEKA_DEFAULT_MARKET_ID));
    const issue = parseEdekaProspektPage(prospektHtml);

    if (!issue) {
      return getFixtureForWeek("edeka", weekScope);
    }

    const candidates = await resolveIssueCandidates(issue);
    const selectedIssue =
      candidates.find((candidate) => candidate.weekScope === weekScope) ??
      (issue.weekScope === weekScope
        ? {
            title: issue.title,
            sourceUrl: issue.sourceUrl,
            assetPath: issue.assetPath,
            validFrom: issue.validFrom,
            validTo: issue.validTo,
            weekScope: issue.weekScope
          }
        : null);

    if (!selectedIssue) {
      return getFixtureForWeek("edeka", weekScope);
    }

    // EDEKA's offer listing page is current-week only. For next week there is
    // no equivalent HTML offers page — only a flipbook XML that lacks product
    // details. Return null so the ingest marks EDEKA as unavailable rather
    // than storing an empty result.
    if (weekScope !== "current") {
      return null;
    }

    let offers = [];
    if (issue.offerUrl) {
      const offersHtml = await fetchHtml(issue.offerUrl);
      offers = parseEdekaOffersPage(offersHtml);
    }

    return {
      issue: {
        title: selectedIssue.title,
        validFrom: selectedIssue.validFrom,
        validTo: selectedIssue.validTo,
        sourceUrl: selectedIssue.sourceUrl,
        assetPath: selectedIssue.assetPath ?? "",
        sourceType: "live-edeka-page",
        weekScope
      },
      offers: offers.length > 0 ? offers : getFixtureForWeek("edeka", weekScope)?.offers ?? []
    };
  } catch (error) {
    console.warn("Falling back to EDEKA fixture adapter:", error.message);
    return getFixtureForWeek("edeka", weekScope);
  }
}
