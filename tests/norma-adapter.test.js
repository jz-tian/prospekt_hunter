import test from "node:test";
import assert from "node:assert/strict";
import {
  parseNormaDatePageTopics,
  parseNormaOverviewPage,
  parseNormaTopicOffers,
  resolveWeekScopeForDate
} from "../lib/ingest/adapters/norma.js";

test("resolveWeekScopeForDate separates current and next week for NORMA", () => {
  const now = new Date("2026-03-13T12:00:00+01:00");
  assert.equal(resolveWeekScopeForDate(new Date("2026-03-09T00:00:00+01:00"), now), "current");
  assert.equal(resolveWeekScopeForDate(new Date("2026-03-18T00:00:00+01:00"), now), "next");
});

test("parseNormaOverviewPage extracts official date pages", () => {
  const html = `
    <li class="lvl-2"><a href="/de/angebote/ab-montag,-09.03.26/" title="ab Montag, den 09. März 2026">ab Montag, 09.03.</a></li>
    <li class="lvl-2"><a href="/de/angebote/ab-mittwoch,-11.03.26/">ab Mittwoch, 11.03.</a></li>
    <li class="lvl-2"><a href="/de/angebote/ab-freitag,-13.03.26/">ab Freitag, 13.03.</a></li>
    <li class="lvl-2"><a href="/de/angebote/ab-montag,-16.03.26/">ab Montag, 16.03.</a></li>
  `;

  const pages = parseNormaOverviewPage(html);
  assert.equal(pages.length, 4);
  assert.equal(pages[0].href, "https://www.norma-online.de/de/angebote/ab-montag,-09.03.26/");
  assert.equal(pages[3].label, "ab Montag, 16.03.");
  assert.equal(`${pages[3].date.getFullYear()}-${String(pages[3].date.getMonth() + 1).padStart(2, "0")}-${String(pages[3].date.getDate()).padStart(2, "0")}`, "2026-03-16");
});

test("parseNormaDatePageTopics extracts topic links from the official dropdown", () => {
  const html = `
    <select id="themenwelt" name="themenwelt">
      <option value="">Wählen Sie Ihre Themenwelt</option>
      <option value="/de/angebote/ab-montag,-09.03.26/mach-deinen-garten_bereit-t-357700/">Mach deinen Garten bereit</option>
      <option selected="selected" value="/de/angebote/ab-montag,-09.03.26/billiger-t-357702/">Billiger!</option>
    </select>
  `;

  const topics = parseNormaDatePageTopics(html);
  assert.deepEqual(topics, [
    {
      href: "https://www.norma-online.de/de/angebote/ab-montag,-09.03.26/mach-deinen-garten_bereit-t-357700/",
      title: "Mach deinen Garten bereit"
    },
    {
      href: "https://www.norma-online.de/de/angebote/ab-montag,-09.03.26/billiger-t-357702/",
      title: "Billiger!"
    }
  ]);
});

test("parseNormaTopicOffers maps official article cards into normalized offers", () => {
  const html = `
    <div id="mach-deinen-garten_bereit-t-357700" aria-label="Artikel des Themas Mach deinen Garten bereit. Verfügbar ab Montag, 09.03.">
      <article class="b463 produktBoxContainer" id="of_358397">
        <a href="/de/angebote/ab-montag,-09.03.26/mach-deinen-garten_bereit-t-357700/elektro-start-benzin-rasenmaeher-i-358397/" id="a_358397">
          <div class="produktBox">
            <div class="produktBox-img produktBox-img--center">
              <img src="/ext/img/product/angebote/26_03_09/100_elektro-start-benzin-rasenmaeher_wo.png" alt="Produktbild »Elektro-Start Benzin-Rasenmäher«"/>
            </div>
            <div class="produktBox-txt">
              <strong class="supplier">Scheppach</strong>
              <h3 class="produktBox-txt-headline">Elektro-Start Benzin-Rasenmäher</h3>
              <p class="produktBox-txt-description">MS226-53E SE</p>
            </div>
            <div class="produktBox-cont">
              <div class="produktBox-cont-wrapper-billiger" title="Sie sparen: 270,&ndash; €"><p>45% billiger</p></div>
              <ul>
                <li class="produktBox-cont-wrapper-uvp">UVP 599,&ndash;</li>
                <li class="produktBox-cont-wrapper-price">329,&ndash;<sup>*</sup></li>
              </ul>
            </div>
          </div>
        </a>
      </article>
      <article class="b463 produktBoxContainer" id="of_358400">
        <a href="/de/angebote/ab-montag,-09.03.26/mach-deinen-garten_bereit-t-357700/gartenhandschuhe-dora-2-paar-i-358400/" id="a_358400">
          <div class="produktBox">
            <div class="produktBox-img produktBox-img--center">
              <img src="/ext/img/product/angebote/26_03_09/100_gartenhandschuhe_wo.png" alt="Produktbild »Gartenhandschuhe 'Dora' 2 Paar«"/>
            </div>
            <div class="produktBox-txt">
              <strong class="supplier">Powertec Garden</strong>
              <h3 class="produktBox-txt-headline">Gartenhandschuhe "Dora" 2 Paar</h3>
              <p class="produktBox-txt-description">für Damen und Herren</p>
            </div>
            <div class="produktBox-cont">
              <ul>
                <li class="produktBox-cont-wrapper-uvp-spacer"></li>
                <li class="produktBox-cont-wrapper-price">3,49<sup>*</sup></li>
              </ul>
            </div>
          </div>
        </a>
      </article>
    </div>
  `;

  const offers = parseNormaTopicOffers(html);
  assert.equal(offers.length, 2);
  assert.deepEqual(offers[0], {
    productName: "Elektro-Start Benzin-Rasenmäher",
    brand: "Scheppach",
    originalPrice: 599,
    salePrice: 329,
    unitInfo: "MS226-53E SE",
    imageUrl: "https://www.norma-online.de/ext/img/product/angebote/26_03_09/100_elektro-start-benzin-rasenmaeher_wo.png",
    productUrl: "https://www.norma-online.de/de/angebote/ab-montag,-09.03.26/mach-deinen-garten_bereit-t-357700/elektro-start-benzin-rasenmaeher-i-358397/",
    sourceSection: "Mach deinen Garten bereit",
    confidenceScore: 0.93
  });
  assert.equal(offers[1].productName, 'Gartenhandschuhe "Dora" 2 Paar');
  assert.equal(offers[1].salePrice, 3.49);
});
