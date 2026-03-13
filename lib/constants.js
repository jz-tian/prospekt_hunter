export const CATEGORY_DEFINITIONS = [
  { slug: "obst-gemuese", name: "Obst & Gemüse", tone: "#eadfc6", textColor: "#a56100" },
  { slug: "fleisch-fisch", name: "Fleisch & Fisch", tone: "#e5dce6", textColor: "#7a416e" },
  { slug: "kaese-eier-molkerei", name: "Käse, Eier & Molkerei", tone: "#dde6df", textColor: "#2a6b3c" },
  { slug: "tiefkuehlkost", name: "Tiefkühlkost", tone: "#dce8eb", textColor: "#1f7286" },
  { slug: "brot-cerealien-aufstriche", name: "Brot, Cerealien & Aufstriche", tone: "#eee0dc", textColor: "#b24f28" },
  { slug: "getraenke-genussmittel", name: "Getränke & Genussmittel", tone: "#efe2dd", textColor: "#b24f28" },
  { slug: "drogerie-gesundheit", name: "Drogerie & Gesundheit", tone: "#dde3ec", textColor: "#255b96" },
  { slug: "kueche-haushalt", name: "Küche & Haushalt", tone: "#dee9e2", textColor: "#2f7645" }
];

export const RETAILERS = [
  { slug: "aldi", name: "ALDI", color: "#1650a2" },
  { slug: "lidl", name: "Lidl", color: "#f4c400" },
  { slug: "denns", name: "Denns BioMarkt", color: "#2f7d32" },
  { slug: "edeka", name: "EDEKA", color: "#003b80" }
];

export const CATEGORY_RULES = [
  { slug: "obst-gemuese", section: ["obst", "gemüse", "frucht"], keywords: ["apfel", "banane", "salat", "tomate", "avocado", "zitrone", "orange"] },
  { slug: "fleisch-fisch", section: ["fleisch", "fisch"], keywords: ["lachs", "steak", "hähnchen", "filet", "schinken", "salami"] },
  { slug: "kaese-eier-molkerei", section: ["käse", "molkerei", "eier"], keywords: ["joghurt", "milch", "käse", "mozzarella", "butter", "ei"] },
  { slug: "tiefkuehlkost", section: ["tiefkühl"], keywords: ["pizza", "pommes", "eis", "tk"] },
  { slug: "brot-cerealien-aufstriche", section: ["brot", "cerealien", "aufstrich"], keywords: ["brot", "müsli", "toast", "marmelade", "croissant"] },
  { slug: "getraenke-genussmittel", section: ["getränke", "genuss"], keywords: ["kaffee", "wasser", "cola", "wein", "saft", "bier"] },
  { slug: "drogerie-gesundheit", section: ["drogerie", "gesundheit"], keywords: ["deo", "shampoo", "toilettenpapier", "zahnpasta", "seife"] },
  { slug: "kueche-haushalt", section: ["haushalt", "küche"], keywords: ["spülmittel", "müllbeutel", "küchenrolle", "folie", "reiniger"] }
];
