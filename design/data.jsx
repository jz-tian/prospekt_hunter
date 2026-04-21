// German grocery data with original fictional retailer styling cues
const RETAILERS = [
  { id: "aldi",   name: "ALDI",      jp: "アルディ",   color: "c-blue",   brand: "#2C4A6E", motto: "Ehrlich günstig" },
  { id: "lidl",   name: "Lidl",      jp: "リドル",     color: "c-red",    brand: "#9B2335", motto: "Lidl lohnt sich" },
  { id: "norma",  name: "NORMA",     jp: "ノルマ",     color: "c-yellow", brand: "#C8A028", motto: "Mehr fürs Geld" },
  { id: "edeka",  name: "EDEKA",     jp: "エデカ",     color: "c-dark",   brand: "#1F1B18", motto: "Wir lieben Lebensmittel" },
  { id: "denns",  name: "denn's Bio",jp: "デンズ・ビオ",color: "c-green",  brand: "#5E7049", motto: "Bio von hier" }
];

const STALL_STATS = {
  aldi:  { offers: 142, valid: "KW 17 · 20.–25.04." },
  lidl:  { offers: 168, valid: "KW 17 · 20.–25.04." },
  norma: { offers:  96, valid: "KW 17 · 20.–25.04." },
  edeka: { offers: 214, valid: "KW 17 · 19.–25.04." },
  denns: { offers:  58, valid: "KW 17 · 20.–26.04." }
};

const STALL_STATS_NEXT = {
  aldi:  { offers: 138, valid: "KW 18 · 27.04.–02.05." },
  lidl:  { offers: 151, valid: "KW 18 · 27.04.–02.05." },
  norma: { offers:  88, valid: "KW 18 · 27.04.–02.05." },
  edeka: { offers: 198, valid: "KW 18 · 26.04.–02.05." },
  denns: { offers:  62, valid: "KW 18 · 27.04.–03.05." }
};

const CATEGORIES = [
  { id: "all", label: "Alle" },
  { id: "obst", label: "Obst & Gemüse" },
  { id: "milch", label: "Milchprodukte" },
  { id: "fleisch", label: "Fleisch & Wurst" },
  { id: "backen", label: "Backwaren" },
  { id: "getraenke", label: "Getränke" },
  { id: "tk", label: "Tiefkühl" },
  { id: "drogerie", label: "Drogerie" },
  { id: "haushalt", label: "Haushalt" }
];

function mkOffer(id, retailerId, title, unit, price, was, cat, tags = []) {
  const discount = Math.round((1 - price / was) * 100);
  return {
    id, retailerId, title, unit,
    price, was, discount,
    cat, tags,
    valid: retailerId === "edeka" ? "bis Sa. 25.04." : retailerId === "denns" ? "bis So. 26.04." : "bis Sa. 25.04."
  };
}

const OFFERS = [
  mkOffer("o1",  "aldi",  "Erdbeeren aus Spanien",         "500g Schale",      1.99, 2.99, "obst",      ["neu"]),
  mkOffer("o2",  "lidl",  "Rinderhackfleisch",              "500g",             3.49, 4.99, "fleisch",   ["tipp"]),
  mkOffer("o3",  "edeka", "Vollmilch 3,5%",                 "1l Flasche",       0.99, 1.29, "milch",     []),
  mkOffer("o4",  "norma", "Bio-Bananen",                    "1kg",              1.79, 2.49, "obst",      []),
  mkOffer("o5",  "denns", "Demeter Naturjoghurt",           "500g",             1.49, 1.99, "milch",     ["bio"]),
  mkOffer("o6",  "aldi",  "Butter deutscher Markenbutter",  "250g",             1.89, 2.59, "milch",     ["tipp"]),
  mkOffer("o7",  "lidl",  "Kaffee Bellarom Gold",           "500g Packung",     4.99, 7.99, "getraenke", []),
  mkOffer("o8",  "edeka", "Schweinelachssteak",             "je 100g",          1.29, 1.99, "fleisch",   []),
  mkOffer("o9",  "norma", "Vollkornbrot gebacken",          "500g",             1.39, 1.89, "backen",    ["neu"]),
  mkOffer("o10", "denns", "Bio-Hafermilch Barista",         "1l",               1.69, 2.29, "getraenke", ["bio"]),
  mkOffer("o11", "aldi",  "Tiefkühl Pizza Salami",          "320g",             1.49, 2.29, "tk",        []),
  mkOffer("o12", "lidl",  "Waschmittel Vollwaschpulver",    "1,35kg · 18 WL",   2.99, 4.49, "drogerie",  ["tipp"]),
  mkOffer("o13", "edeka", "Mozzarella Büffel",              "125g",             1.79, 2.49, "milch",     []),
  mkOffer("o14", "norma", "Äpfel Elstar",                   "2kg Netz",         2.49, 3.49, "obst",      []),
  mkOffer("o15", "denns", "Bio-Eier Bodenhaltung",          "10 Stück · M",     2.99, 3.79, "milch",     ["bio"]),
  mkOffer("o16", "aldi",  "Gouda jung am Stück",            "400g",             2.99, 4.49, "milch",     []),
  mkOffer("o17", "lidl",  "Mineralwasser Kristall",         "6 × 1,5l Kasten",  3.99, 5.49, "getraenke", []),
  mkOffer("o18", "edeka", "Baguette Original",              "250g",             0.89, 1.29, "backen",    ["neu"]),
  mkOffer("o19", "norma", "Hähnchenbrustfilet",             "500g",             3.99, 5.49, "fleisch",   []),
  mkOffer("o20", "denns", "Bio-Olivenöl kaltgepresst",      "500ml",            6.99, 9.49, "haushalt",  ["bio","tipp"])
];

const PROSPEKTE = [
  { id: "p1", retailerId: "aldi",  title: "ALDI Wochenprospekt", pages: 36, valid: "ab Mo. 20.04.", cover: "FRISCHE-WOCHE" },
  { id: "p2", retailerId: "lidl",  title: "Lidl Angebote KW 17", pages: 44, valid: "ab Mo. 20.04.", cover: "TOP-DEALS" },
  { id: "p3", retailerId: "norma", title: "NORMA Prospekt",      pages: 28, valid: "ab Mo. 20.04.", cover: "SPAR-MARKT" },
  { id: "p4", retailerId: "edeka", title: "EDEKA Wochenheft",     pages: 52, valid: "ab Do. 19.04.", cover: "WIR LIEBEN" },
  { id: "p5", retailerId: "denns", title: "denn's Bio Journal",   pages: 24, valid: "ab Mo. 20.04.", cover: "BIO-WOCHE" },
  { id: "p6", retailerId: "aldi",  title: "ALDI Aktionsheft Haushalt", pages: 20, valid: "ab Do. 23.04.", cover: "GARTEN & HOF" },
  { id: "p7", retailerId: "lidl",  title: "Lidl Fit & Aktiv",     pages: 16, valid: "ab Do. 23.04.", cover: "FITNESS" },
  { id: "p8", retailerId: "edeka", title: "EDEKA Regionalheft",    pages: 24, valid: "ab Mo. 20.04.", cover: "AUS DER REGION" }
];

Object.assign(window, { RETAILERS, STALL_STATS, STALL_STATS_NEXT, CATEGORIES, OFFERS, PROSPEKTE, mkOffer });
