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
  const normalizedHaystack = normalizeText(haystack);
  const normalizedNeedle = normalizeText(needle);

  if (!normalizedNeedle) {
    return false;
  }

  // Exact whole-word match
  if (` ${normalizedHaystack} `.includes(` ${normalizedNeedle} `)) {
    return true;
  }

  // German compound word matching: for keywords ≥5 chars, check whether the
  // keyword appears as a suffix of any single token in the haystack.
  // Suffix-only is intentional: in German, the last component (Grundwort)
  // carries the semantic category, e.g. "rinderhackfleisch" → "hackfleisch",
  // "sahnejoghurt" → "joghurt", "mineralwasser" → "wasser".
  // Prefix matching is skipped to avoid false matches like "orange" capturing
  // "orangensaft" before the Getränke rule can match.
  if (normalizedNeedle.length >= 5) {
    for (const token of normalizedHaystack.split(" ")) {
      if (token.length > normalizedNeedle.length && token.endsWith(normalizedNeedle)) {
        return true;
      }
    }
  }

  return false;
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
