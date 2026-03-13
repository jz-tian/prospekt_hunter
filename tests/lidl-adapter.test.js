import test from "node:test";
import assert from "node:assert/strict";
import { parseLidlOverview, resolveWeekScopeForDate } from "../lib/ingest/adapters/lidl.js";

test("resolveWeekScopeForDate separates current and next week", () => {
  const now = new Date("2026-03-12T12:00:00+01:00");
  assert.equal(resolveWeekScopeForDate(new Date("2026-03-09T00:00:00+01:00"), now), "current");
  assert.equal(resolveWeekScopeForDate(new Date("2026-03-16T00:00:00+01:00"), now), "next");
});

test("parseLidlOverview extracts current and next aktionsprospekt", () => {
  const html = `
    <div class="section-head">Unsere Aktionsprospekte</div>
    <div class="subcategory">
      <a href="https://www.lidl.de/l/prospekte/aktionsprospekt-09-03-2026-14-03-2026-e82f6a/ar/0?lf=HHZ" data-track-id="current-id">
        <div class="flyer__name">Aktionsprospekt</div>
        <span class="flyer__title">09.03.2026 – 14.03.2026</span>
      </a>
      <a href="https://www.lidl.de/l/prospekte/aktionsprospekt-16-03-2026-21-03-2026-7b1625/ar/0?lf=HHZ" data-track-id="next-id">
        <div class="flyer__name">Aktionsprospekt</div>
        <span class="flyer__title">16.03.2026 – 21.03.2026</span>
      </a>
    </div>
    </section>
  `;

  const prospects = parseLidlOverview(html, new Date("2026-03-12T12:00:00+01:00"));
  assert.equal(prospects.length, 2);
  assert.equal(prospects[0].flyerId, "current-id");
  assert.equal(prospects[0].weekScope, "current");
  assert.equal(prospects[1].flyerId, "next-id");
  assert.equal(prospects[1].weekScope, "next");
});
