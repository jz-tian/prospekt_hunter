import { CATEGORY_RULES } from "./constants.js";

export function categorizeOffer({ productName, sourceSection = "" }) {
  const normalizedName = productName.toLowerCase();
  const normalizedSection = sourceSection.toLowerCase();

  for (const rule of CATEGORY_RULES) {
    if (rule.section.some((entry) => normalizedSection.includes(entry))) {
      return rule.slug;
    }
  }

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((entry) => normalizedName.includes(entry))) {
      return rule.slug;
    }
  }

  return "getraenke-genussmittel";
}
