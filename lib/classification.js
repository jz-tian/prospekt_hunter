import { CATEGORY_RULES } from "./constants.js";

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function containsTerm(haystack, needle) {
  const normalizedHaystack = ` ${normalizeText(haystack)} `;
  const normalizedNeedle = normalizeText(needle);

  if (!normalizedNeedle) {
    return false;
  }

  return normalizedHaystack.includes(` ${normalizedNeedle} `);
}

export function categorizeOffer({ productName, sourceSection = "" }) {
  for (const rule of CATEGORY_RULES) {
    if (rule.section.some((entry) => containsTerm(sourceSection, entry))) {
      return rule.slug;
    }
  }

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((entry) => containsTerm(productName, entry))) {
      return rule.slug;
    }
  }

  return "sonstige";
}
