import test from "node:test";
import assert from "node:assert/strict";
import { parseDennsPageData, resolveWeekScopeForDate } from "../lib/ingest/adapters/denns.js";

test("resolveWeekScopeForDate separates current and next week for Denns", () => {
  const now = new Date("2026-03-13T12:00:00+01:00");
  assert.equal(resolveWeekScopeForDate(new Date("2026-03-11T00:00:00+01:00"), now), "current");
  assert.equal(resolveWeekScopeForDate(new Date("2026-03-18T00:00:00+01:00"), now), "next");
});

test("parseDennsPageData maps official current-week page-data into issue and offers", () => {
  const payload = {
    result: {
      data: {
        sanityMarketData: {
          name: "Denns BioMarkt München"
        },
        sanityAllOffers: {
          nodes: [
            {
              _id: "offer-1",
              title: "Crème fraîche",
              brand: "dennree",
              price: "0,99",
              priceApp: "0,89",
              priceb: "1,09",
              pricec: "1 kg=6,60",
              priceAppKilo: "1 kg=5,93",
              subtitle: "150 g",
              validfrom: "2026-03-11",
              validto: "2026-03-24",
              appValidfrom: "2026-03-11",
              appValidto: "2026-03-17",
              offerImage: {
                image: {
                  asset: {
                    url: "https://cdn.sanity.io/images/example/creme-fraiche.png"
                  }
                }
              },
              image: "https://images.dennree.de/fitinto/576x384/102475.top.png?backgroundColor=transparent",
              articleGroup: {
                productGroup: {
                  title: "Zum Kühlen"
                }
              },
              hidden: false
            },
            {
              _id: "offer-2",
              title: "Aubergine",
              brand: "",
              price: "4,99",
              priceApp: "",
              priceb: null,
              pricec: null,
              subtitle: "1 kg",
              validfrom: "2026-03-11",
              validto: "2026-03-17",
              appValidfrom: null,
              appValidto: null,
              image: "https://images.dennree.de/fitinto/576x384/218068.top.png?backgroundColor=transparent",
              articleGroup: {
                productGroup: {
                  title: "Obst & Gemüse"
                }
              },
              hidden: false
            }
          ]
        }
      },
      pageContext: {
        campaignEnd: "2026-03-24",
        offerHandouts: [
          {
            offerRanges: [
              {
                range: ["2026-03-07", "2026-03-24"],
                DeOfferHandouts: {
                  dennsTwelvePagerCustomLink: "https://prospekt.biomarkt.de/denns_biomarkt_kw_11-12_2026/"
                }
              }
            ]
          }
        ]
      }
    }
  };

  const parsed = parseDennsPageData(payload, "current", new Date("2026-03-13T12:00:00+01:00"), "muenchen-regerstr");
  assert.deepEqual(parsed.issue, {
    title: "Denns BioMarkt München Angebote",
    validFrom: "2026-03-11",
    validTo: "2026-03-24",
    sourceUrl: "https://www.biomarkt.de/muenchen-regerstr/angebote",
    assetPath: "https://prospekt.biomarkt.de/denns_biomarkt_kw_11-12_2026/",
    sourceType: "live-denns-page-data",
    weekScope: "current"
  });
  assert.equal(parsed.offers.length, 2);
  assert.deepEqual(parsed.offers[0], {
    productName: "Crème fraîche",
    brand: "dennree",
    originalPrice: 1.09,
    salePrice: 0.89,
    unitInfo: "150 g · 1 kg=6,60 · 1 kg=5,93",
    imageUrl: "https://cdn.sanity.io/images/example/creme-fraiche.png",
    productUrl: "https://www.biomarkt.de/muenchen-regerstr/angebote",
    sourceSection: "Zum Kühlen",
    confidenceScore: 0.96,
    priceLabel: null,
    offerKind: "product"
  });
  assert.equal(parsed.offers[1].productName, "Aubergine");
  assert.equal(parsed.offers[1].salePrice, 4.99);
});

test("parseDennsPageData shows the official card price on the current page and keeps next-week offers in the next scope", () => {
  const payload = {
    result: {
      data: {
        sanityMarketData: {
          name: "Denns BioMarkt München"
        },
        sanityAllOffers: {
          nodes: [
            {
              _id: "offer-next",
              title: "Rindfleischburger",
              brand: "Königshofer",
              price: "4,99",
              priceApp: "4,25",
              priceb: "5,79",
              pricec: "1 kg=19,96",
              subtitle: "250 g",
              validfrom: "2026-03-11",
              validto: "2026-03-24",
              appValidfrom: "2026-03-18",
              appValidto: "2026-03-24",
              image: "https://images.dennree.de/fitinto/576x384/154809.top.png?backgroundColor=transparent",
              articleGroup: {
                productGroup: {
                  title: "Zum Kühlen"
                }
              },
              hidden: false
            }
          ]
        }
      },
      pageContext: {
        offerHandouts: []
      }
    }
  };

  const current = parseDennsPageData(payload, "current", new Date("2026-03-13T12:00:00+01:00"), "muenchen-regerstr");
  const next = parseDennsPageData(payload, "next", new Date("2026-03-13T12:00:00+01:00"), "muenchen-regerstr");

  assert.equal(current.offers[0].salePrice, 4.25);
  assert.equal(current.offers[0].originalPrice, 5.79);
  assert.equal(next.offers[0].salePrice, 4.25);
  assert.equal(next.offers[0].originalPrice, 5.79);
});

test("parseDennsPageData keeps percentage promo cards from the official page as labeled coupons", () => {
  const payload = {
    result: {
      data: {
        sanityMarketData: {
          name: "Denns BioMarkt München"
        },
        sanityAllOffers: {
          nodes: [
            {
              _id: "offer-coupon",
              title: "10% Rabatt* auf Trockenfrüchte von dennree",
              couponId: "2600046",
              validfrom: "2026-03-11",
              validto: "2026-03-17",
              image: "https://images.dennree.de/fitinto/576x384/example.png?backgroundColor=transparent",
              hidden: false
            }
          ]
        }
      },
      pageContext: {
        campaignEnd: "2026-03-24",
        offerHandouts: []
      }
    }
  };

  const parsed = parseDennsPageData(payload, "current", new Date("2026-03-13T12:00:00+01:00"), "muenchen-regerstr");
  assert.equal(parsed.offers.length, 1);
  assert.deepEqual(parsed.offers[0], {
    productName: "10% Rabatt* auf Trockenfrüchte von dennree",
    brand: null,
    originalPrice: null,
    salePrice: 0,
    unitInfo: null,
    imageUrl: "https://images.dennree.de/fitinto/576x384/example.png?backgroundColor=transparent",
    productUrl: "https://www.biomarkt.de/muenchen-regerstr/angebote",
    sourceSection: "",
    confidenceScore: 0.96,
    priceLabel: "10% Rabatt",
    offerKind: "coupon"
  });
});
