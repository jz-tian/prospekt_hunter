import he from "he";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const NORMA_BASE_URL = "https://www.norma-online.de";
const NORMA_OFFERS_URL = `${NORMA_BASE_URL}/de/angebote/`;
const NORMA_ONLINE_PROSPEKT_URL = `${NORMA_BASE_URL}/de/angebote/onlineprospekt/`;
const execFileAsync = promisify(execFile);

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

function absoluteUrl(value, baseUrl = NORMA_BASE_URL) {
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
  const normalized = cleanText(value)
    .replace(/[–—]/g, "-")
    .replace(/\*/g, "")
    .replace(/\s+/g, "");

  const match = normalized.match(/(\d+)(?:,(\d{1,2}|-))?/);
  if (!match) {
    return null;
  }

  const [, whole, decimals] = match;
  const cents = !decimals || decimals === "-" ? "00" : decimals.padEnd(2, "0");
  const parsed = Number(`${whole}.${cents}`);
  return Number.isFinite(parsed) ? parsed : null;
}

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

function parseNormaDate(value) {
  const match = cleanText(value).match(/(\d{2})\.(\d{2})\.(\d{2,4})/);
  if (!match) {
    return null;
  }

  const [, day, month, rawYear] = match;
  const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
  const parsed = new Date(`${year}-${month}-${day}T00:00:00+01:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseNormaDateFromHref(value) {
  const match = cleanText(value).match(/(\d{2})\.(\d{2})\.(\d{2})/);
  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  const parsed = new Date(`20${year}-${month}-${day}T00:00:00+01:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function resolveWeekScopeForDate(date, now = new Date()) {
  const currentMonday = getMonday(now);
  const nextMonday = addDays(currentMonday, 7);
  const nextNextMonday = addDays(nextMonday, 7);

  if (date >= nextMonday && date < nextNextMonday) {
    return "next";
  }

  return "current";
}

export function parseNormaOverviewPage(html) {
  const datePages = [];
  const seen = new Set();
  const pattern = /<li class="lvl-2[^"]*">\s*<a href="([^"]+)"[^>]*>(ab [^<]+)<\/a>/gi;
  let match;

  while ((match = pattern.exec(html)) !== null) {
    const [, href, label] = match;
    const date = parseNormaDate(label) ?? parseNormaDateFromHref(href);
    const url = absoluteUrl(href);

    if (!date || !url || seen.has(url)) {
      continue;
    }
    seen.add(url);

    datePages.push({
      href: url,
      label: cleanText(label),
      date
    });
  }

  return datePages.sort((a, b) => a.date - b.date);
}

export function parseNormaDatePageTopics(html) {
  const topics = [];
  const seen = new Set();
  const pattern = /<option(?:[^>]*selected="selected")? value="([^"]+)">([^<]+)<\/option>/gi;
  let match;

  while ((match = pattern.exec(html)) !== null) {
    const [, href, title] = match;
    const normalizedTitle = cleanText(title);
    const url = absoluteUrl(href);

    if (!url || !normalizedTitle || normalizedTitle === "Wählen Sie Ihre Themenwelt" || seen.has(url)) {
      continue;
    }
    seen.add(url);

    topics.push({
      href: url,
      title: normalizedTitle
    });
  }

  return topics;
}

export function parseNormaTopicOffers(html, fallbackSection = "") {
  const offers = [];
  const seen = new Set();
  const articlePattern = /<article class="b463 produktBoxContainer" id="of_[^"]+">[\s\S]*?<\/article>/gi;
  const sectionMatch = html.match(/aria-label="Artikel des Themas ([^"]+)/i);
  const sourceSection = cleanText(sectionMatch?.[1] || fallbackSection).replace(/\.\s*Verfügbar[\s\S]*$/i, "").trim();
  let articleMatch;

  while ((articleMatch = articlePattern.exec(html)) !== null) {
    const articleMarkup = articleMatch[0];
    const hrefMatch = articleMarkup.match(/<a href="([^"]+)" id="a_\d+">/i);
    const imageMatch = articleMarkup.match(/<img src="([^"]+)" alt="([^"]*)"/i);
    const brandMatch = articleMarkup.match(/<strong class="supplier">([\s\S]*?)<\/strong>/i);
    const titleMatch = articleMarkup.match(/<h3 class="produktBox-txt-headline">([\s\S]*?)<\/h3>/i);
    const descriptionMatch = articleMarkup.match(/<p class="produktBox-txt-description">([\s\S]*?)<\/p>/i);
    const inhaltMatch = articleMarkup.match(/<li class="produktBox-txt-inh">([\s\S]*?)<\/li>/i);
    const priceInfoMatch = articleMarkup.match(/<li class="produktBox-txt-price">([\s\S]*?)<\/li>/i);
    const refMatch = articleMarkup.match(/<li class="produktBox-txt-ref">([\s\S]*?)<\/li>/i);
    const salePriceMatch = articleMarkup.match(/produktBox-cont-wrapper-price">([\s\S]*?)<sup>/i);
    const originalPriceMatch = articleMarkup.match(/produktBox-cont-wrapper-uvp">([\s\S]*?)<\/li>/i);

    const productUrl = absoluteUrl(hrefMatch?.[1]);
    const productName = cleanText(titleMatch?.[1] || imageMatch?.[2]);
    const salePrice = parsePrice(salePriceMatch?.[1]);
    if (!productUrl || !productName || salePrice == null || seen.has(productUrl)) {
      continue;
    }
    seen.add(productUrl);

    const unitInfo = [
      cleanText(descriptionMatch?.[1]),
      cleanText(inhaltMatch?.[1]),
      cleanText(priceInfoMatch?.[1]),
      cleanText(refMatch?.[1])
    ]
      .filter(Boolean)
      .join(" · ");

    offers.push({
      productName,
      brand: cleanText(brandMatch?.[1]) || null,
      originalPrice: parsePrice(originalPriceMatch?.[1]),
      salePrice,
      unitInfo: unitInfo || null,
      imageUrl: absoluteUrl(imageMatch?.[1]),
      productUrl,
      sourceSection,
      confidenceScore: 0.93
    });
  }

  return offers;
}

async function fetchHtml(url) {
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0 AngebotsRadar/0.1",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "de-DE,de;q=0.9,en;q=0.8"
      },
      next: {
        revalidate: 3600
      }
    });

    if (!response.ok) {
      throw new Error(`NORMA request failed with ${response.status} for ${url}`);
    }

    return response.text();
  } catch (fetchError) {
    const { stdout } = await execFileAsync("curl", ["-L", url], {
      maxBuffer: 10 * 1024 * 1024
    });

    if (!stdout || !stdout.trim()) {
      throw fetchError;
    }

    return stdout;
  }
}

function resolveRelevantDatePages(datePages, weekScope, now = new Date()) {
  return datePages.filter((page) => resolveWeekScopeForDate(page.date, now) === weekScope);
}

export async function fetchNormaProspekt(weekScope = "current", now = new Date()) {
  const overviewHtml = await fetchHtml(NORMA_OFFERS_URL);
  const datePages = parseNormaOverviewPage(overviewHtml);
  const relevantPages = resolveRelevantDatePages(datePages, weekScope, now);

  if (relevantPages.length === 0) {
    throw new Error(`No NORMA date pages found for ${weekScope}`);
  }

  const offers = [];
  const seen = new Set();

  for (const page of relevantPages) {
    const datePageHtml = await fetchHtml(page.href);
    const topics = parseNormaDatePageTopics(datePageHtml);

    for (const topic of topics) {
      const topicHtml = await fetchHtml(topic.href);
      const topicOffers = parseNormaTopicOffers(topicHtml, topic.title);

      for (const offer of topicOffers) {
        const dedupeKey = offer.productUrl || `${offer.productName}:${offer.salePrice}:${offer.sourceSection}`;
        if (seen.has(dedupeKey)) {
          continue;
        }
        seen.add(dedupeKey);
        offers.push(offer);
      }
    }
  }

  if (offers.length === 0) {
    throw new Error(`No NORMA offers found for ${weekScope}`);
  }

  const validFrom = relevantPages[0].date;
  const monday = getMonday(validFrom);
  const validTo = addDays(monday, 6);

  return {
    issue: {
      title: "NORMA Angebote",
      validFrom: formatIsoDate(validFrom),
      validTo: formatIsoDate(validTo),
      sourceUrl: NORMA_OFFERS_URL,
      assetPath: NORMA_ONLINE_PROSPEKT_URL,
      sourceType: "live-norma-html",
      weekScope
    },
    offers
  };
}
