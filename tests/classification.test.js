import test from "node:test";
import assert from "node:assert/strict";
import { categorizeOffer } from "../lib/classification.js";
import { selectFeaturedOffers } from "../lib/featured-offers.js";

test("categorizeOffer prefers source section mapping", () => {
  assert.equal(
    categorizeOffer({ productName: "Unbekanntes Produkt", sourceSection: "Obst & Gemüse" }),
    "obst-gemuese"
  );
});

test("categorizeOffer falls back to keyword mapping", () => {
  assert.equal(
    categorizeOffer({ productName: "Zewa Toilettenpapier", sourceSection: "" }),
    "drogerie-gesundheit"
  );
});

test("categorizeOffer separates hot drinks from regular beverages", () => {
  assert.equal(
    categorizeOffer({ productName: "Jacobs Barista Kaffee Crema Bohnen", sourceSection: "Heißgetränke" }),
    "kaffee-tee-kakao"
  );
  assert.equal(
    categorizeOffer({ productName: "Adelholzener Limonade oder Schorle", sourceSection: "Getränke" }),
    "getraenke"
  );
});

test("categorizeOffer distinguishes pantry and snack products", () => {
  assert.equal(
    categorizeOffer({ productName: "Passierte Tomaten", sourceSection: "Konserven - Gemüsekonserven" }),
    "vorrat-konserven"
  );
  assert.equal(
    categorizeOffer({ productName: "Milka Choco Sensations", sourceSection: "" }),
    "suesses-snacks"
  );
});

test("categorizeOffer maps baby and pet supplies", () => {
  assert.equal(
    categorizeOffer({ productName: "Pampers Baby-Dry Windeln", sourceSection: "" }),
    "baby-tierbedarf"
  );
});

test("categorizeOffer maps fashion and wellness samples correctly", () => {
  assert.equal(
    categorizeOffer({
      productName: "esmara U.S. x Grand Polo Damen Sweatkleid",
      sourceSection: "Kategorien/Mode/Damenmode/Kleider & Jumpsuits/Mini-Kleider"
    }),
    "mode-bekleidung"
  );

  assert.equal(
    categorizeOffer({
      productName: "CRIVIT Mini Massage Gun",
      sourceSection: "Kategorien/Gesundheit & Pflege/Wellness/Massage/Massagegeräte"
    }),
    "drogerie-gesundheit"
  );
});

test("categorizeOffer avoids overly broad substring matches", () => {
  assert.equal(
    categorizeOffer({
      productName: "esmara U.S. x Grand Polo Damen Sweatkleid",
      sourceSection: "Kategorien/Mode/Damenmode/Kleider & Jumpsuits/Mini-Kleider"
    }),
    "mode-bekleidung"
  );

  assert.equal(
    categorizeOffer({
      productName: "Bio Sonnenblumenoel Klassiker",
      sourceSection: "Vorrat"
    }),
    "vorrat-konserven"
  );
});

test("categorizeOffer does not treat culinary travel sections as sports", () => {
  assert.equal(
    categorizeOffer({
      productName: "Käsewaffeln",
      sourceSection: "Kulinarische Reise"
    }),
    "suesses-snacks"
  );

  assert.equal(
    categorizeOffer({
      productName: "Original Letscho",
      sourceSection: "Kulinarische Reise"
    }),
    "vorrat-konserven"
  );

  assert.equal(
    categorizeOffer({
      productName: "Polnische Wurstspezialität",
      sourceSection: "Kulinarische Reise"
    }),
    "fleisch-fisch"
  );

  assert.equal(
    categorizeOffer({
      productName: "Original Cufte",
      sourceSection: "Kulinarische Reise"
    }),
    "fleisch-fisch"
  );
});

test("categorizeOffer maps common food and household fallback items out of sonstige", () => {
  assert.equal(categorizeOffer({ productName: "Bio-Fruchtjoghurt", sourceSection: "" }), "kaese-eier-molkerei");
  assert.equal(categorizeOffer({ productName: "Knorr Suppenliebe", sourceSection: "Grundnahrung" }), "vorrat-konserven");
  assert.equal(categorizeOffer({ productName: "Katjes Fruchtgummi", sourceSection: "Knabbern & Naschen" }), "suesses-snacks");
  assert.equal(categorizeOffer({ productName: "Bio-Haferdrink", sourceSection: "H-Milchprodukte/Milchersatzprodukte" }), "kaese-eier-molkerei");
  assert.equal(categorizeOffer({ productName: "Kaffeefilter", sourceSection: "Papierwaren - Servietten/Geschirr" }), "haushalt-kueche-garten");
  assert.equal(categorizeOffer({ productName: "Glenalba Blended Scotch Whisky", sourceSection: "Kategorien/Spirituosen/Whiskey" }), "getraenke");
});

test("categorizeOffer catches another loop of food-like sonstige leftovers", () => {
  assert.equal(categorizeOffer({ productName: "Bio-Schlagsahne", sourceSection: "Milch/Sahne/Butter - Sahne" }), "kaese-eier-molkerei");
  assert.equal(categorizeOffer({ productName: "Vegane Bio-Streichcreme", sourceSection: "Konfitüren/Brotaufstriche - Herzhafte Aufstriche" }), "vorrat-konserven");
  assert.equal(categorizeOffer({ productName: "Bio-Dinkelnudeln", sourceSection: "Nährmittel - Teigwaren" }), "vorrat-konserven");
  assert.equal(categorizeOffer({ productName: "Bio-Bacon", sourceSection: "Gekühlte Wurstwaren - Restliche Pökelware" }), "fleisch-fisch");
  assert.equal(categorizeOffer({ productName: "nimm2®", sourceSection: "Bonbons/Kaugummi - Kaubonbons" }), "suesses-snacks");
  assert.equal(categorizeOffer({ productName: "Primitivo Salento IGP trocken, Rotwein 2023", sourceSection: "Kategorien/Weinwelt/Weinart/Rotwein" }), "getraenke");
});

test("categorizeOffer catches a third loop of pantry, meat, sweets and wine leftovers", () => {
  assert.equal(categorizeOffer({ productName: "Schwäbische Maultaschen", sourceSection: "Gekühlte Fertiggerichte - Teigwaren" }), "vorrat-konserven");
  assert.equal(categorizeOffer({ productName: "Zuckerglasur", sourceSection: "" }), "vorrat-konserven");
  assert.equal(categorizeOffer({ productName: "Bio-Honig", sourceSection: "Konfitüren/Brotaufstriche - Honig" }), "vorrat-konserven");
  assert.equal(categorizeOffer({ productName: "Polnische Jagdwurst", sourceSection: "Kulinarische Reise" }), "fleisch-fisch");
  assert.equal(categorizeOffer({ productName: "Irischer Sahnelikör", sourceSection: "" }), "getraenke");
  assert.equal(categorizeOffer({ productName: "Zarte Waffelwürfel im Doppelpack", sourceSection: "XXL" }), "suesses-snacks");
  assert.equal(categorizeOffer({ productName: "Rindfleischburger", sourceSection: "Zum Kühlen" }), "fleisch-fisch");
});

test("selectFeaturedOffers balances score with retailer and category diversity", () => {
  const featured = selectFeaturedOffers([
    { id: 1, retailerSlug: "aldi", categorySlug: "obst-gemuese", productName: "Apfel", salePrice: 0.99, originalPrice: 1.99, offerKind: "product", confidenceScore: 0.9, imageUrl: "x" },
    { id: 2, retailerSlug: "aldi", categorySlug: "obst-gemuese", productName: "Banane", salePrice: 0.89, originalPrice: 0.99, offerKind: "product", confidenceScore: 0.9, imageUrl: "x" },
    { id: 3, retailerSlug: "lidl", categorySlug: "kaffee-tee-kakao", productName: "Kaffee", salePrice: 3.99, originalPrice: 6.99, offerKind: "product", confidenceScore: 0.9, imageUrl: "x" },
    { id: 4, retailerSlug: "denns", categorySlug: "kaese-eier-molkerei", productName: "Joghurt", salePrice: 1.29, originalPrice: 1.89, offerKind: "product", confidenceScore: 0.9, imageUrl: "x" },
    { id: 5, retailerSlug: "norma", categorySlug: "haushalt-kueche-garten", productName: "Spülmittel", salePrice: 1.49, originalPrice: 2.49, offerKind: "product", confidenceScore: 0.9, imageUrl: "x" },
    { id: 6, retailerSlug: "edeka", categorySlug: "suesses-snacks", productName: "Schokolade", salePrice: 1.11, originalPrice: 2.22, offerKind: "product", confidenceScore: 0.9, imageUrl: "x" },
    { id: 7, retailerSlug: "aldi", categorySlug: "getraenke", productName: "Wasser", salePrice: 0.29, originalPrice: null, offerKind: "product", confidenceScore: 0.9, imageUrl: "x" }
  ], 6);

  assert.equal(featured.length, 6);
  assert.ok(featured.some((offer) => offer.retailerSlug === "lidl"));
  assert.ok(featured.some((offer) => offer.categorySlug === "haushalt-kueche-garten"));
  assert.ok(featured.filter((offer) => offer.retailerSlug === "aldi").length <= 2);
});
