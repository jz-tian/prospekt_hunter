import test from "node:test";
import assert from "node:assert/strict";
import { parseEdekaCatalogueXml, parseEdekaOffersPage, parseEdekaProspektPage, resolveWeekScopeForDate } from "../lib/ingest/adapters/edeka.js";

test("resolveWeekScopeForDate separates current and next week for EDEKA", () => {
  const now = new Date("2026-03-13T12:00:00+01:00");
  assert.equal(resolveWeekScopeForDate(new Date("2026-03-08T00:00:00+01:00"), now), "current");
  assert.equal(resolveWeekScopeForDate(new Date("2026-03-15T00:00:00+01:00"), now), "next");
});

test("parseEdekaProspektPage extracts catalogue metadata from __NEXT_DATA__", () => {
  const html = `
    <script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
      props: {
        pageProps: {
          market: {
            id: 10003350,
            name: "EDEKA",
            url: "https://www.edeka.de/eh/suedbayern/testmarkt/index.jsp",
            offerUrl: "https://www.edeka.de/eh/suedbayern/testmarkt/angebote.jsp",
            catalogue: {
              url: "https://blaetterkatalog.edeka.de/SUEDBAYERN/example/index.html",
              validFrom: "2026-03-07T23:00:00.000+00:00",
              validTo: "2026-03-14T22:59:59.000+00:00",
              previewUrl: "https://blaetterkatalog.edeka.de/SUEDBAYERN/example/blaetterkatalog/large/bk_1.jpg",
              specials: []
            }
          }
        }
      },
      query: {
        marketId: "10003350"
      }
    })}</script>
  `;

  const issue = parseEdekaProspektPage(html, new Date("2026-03-13T12:00:00+01:00"));
  assert.equal(issue.marketId, "10003350");
  assert.equal(issue.validFrom, "2026-03-08");
  assert.equal(issue.validTo, "2026-03-14");
  assert.equal(issue.offerUrl, "https://www.edeka.de/eh/suedbayern/testmarkt/angebote.jsp");
  assert.equal(issue.weekScope, "current");
});

test("parseEdekaCatalogueXml extracts official validity window from blaetterkatalog XML", () => {
  const xml = `
    <?xml version="1.0" encoding="UTF-8"?>
    <catalog name="Blaetterkatalog">
      <mapping>
        <range id_start="1" nr_start="1" pages="24" />
      </mapping>
      <valid>
        <from>2026-03-15</from>
        <to>2026-03-21</to>
      </valid>
    </catalog>
  `;

  const catalogue = parseEdekaCatalogueXml(xml, new Date("2026-03-13T12:00:00+01:00"));
  assert.deepEqual(catalogue, {
    validFrom: "2026-03-15",
    validTo: "2026-03-21",
    pageCount: 24,
    weekScope: "next"
  });
});

test("parseEdekaOffersPage extracts categorized offer cards from server-rendered HTML", () => {
  const html = `
    <filter-controller>
      <li id="drogerie" data-on-page-navigation-title="Drogerie & Haushalt" class="border-t">
        <h3>Drogerie & Haushalt</h3>
        <load-more>
          <ul id="filter-results-group-list-drogerie">
            <li id="filter-results-item-one" data-show-by-filter="true">
              <article>
                <div>
                  <h4>
                    <a href="#angebot-1">
                      <span class="sr-only">Angebot:</span>
                      Hakle Toilettenpapier
                    </a>
                  </h4>
                  <strong class="text-sm text-grey inline-block sm:text-base">
                    Gültig ab 12.03.2026
                  </strong>
                  <ul><li><div class="sr-only">Festpreis von 2.88 €</div></li></ul>
                  <p class="line-clamp-2">
                    4-lagig, Wochenend-Knüller, je 8x130 Blatt Packung
                  </p>
                </div>
                <img src="https://offer-images.api.edeka/hakle.png" alt="" />
              </article>
            </li>
          </ul>
        </load-more>
      </li>
      <li id="getraenke" data-on-page-navigation-title="Getränke & Genussmittel" class="border-t">
        <h3>Getränke & Genussmittel</h3>
        <load-more>
          <ul id="filter-results-group-list-getraenke">
            <li id="filter-results-item-two" data-show-by-filter="true">
              <article>
                <div>
                  <h4>
                    <a href="#angebot-2">
                      <span class="sr-only">Angebot:</span>
                      Mumm Jahrgangssekt
                    </a>
                  </h4>
                  <ul><li><div class="sr-only">Rabattierter Preis von 3.99 € (Insgesamt -20 % Rabatt)</div></li></ul>
                  <p class="line-clamp-2">
                    0,75 l Flasche
                  </p>
                </div>
                <img src="https://offer-images.api.edeka/mumm.png" alt="" />
              </article>
            </li>
          </ul>
        </load-more>
      </li>
    </filter-controller>
  `;

  const offers = parseEdekaOffersPage(html);
  assert.equal(offers.length, 2);
  assert.deepEqual(offers[0], {
    productName: "Hakle Toilettenpapier",
    brand: null,
    salePrice: 2.88,
    unitInfo: "4-lagig, Wochenend-Knüller, je 8x130 Blatt Packung · Gültig ab 12.03.2026",
    imageUrl: "https://offer-images.api.edeka/hakle.png",
    productUrl: null,
    sourceSection: "Drogerie & Haushalt",
    confidenceScore: 0.92
  });
  assert.equal(offers[1].productName, "Mumm Jahrgangssekt");
  assert.equal(offers[1].salePrice, 3.99);
  assert.equal(offers[1].sourceSection, "Getränke & Genussmittel");
});
