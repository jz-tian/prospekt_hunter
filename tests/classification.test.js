import test from "node:test";
import assert from "node:assert/strict";
import { categorizeOffer } from "../lib/classification.js";

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
