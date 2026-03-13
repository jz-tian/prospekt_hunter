import { OfferCard } from "@/components/offer-card";
import { OffersFilter } from "@/components/offers-filter";
import { RefreshDataButton } from "@/components/refresh-data-button";
import { SiteShell } from "@/components/site-shell";
import { WeekScopeSwitcher } from "@/components/week-scope-switcher";
import { listCategories, listOffers } from "@/lib/db";
import { RETAILERS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function OffersPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const weekScope = resolvedSearchParams.week === "next" ? "next" : "current";
  const offers = listOffers(resolvedSearchParams);
  const categories = listCategories(weekScope);
  const hasFixtureOffers = offers.some((offer) => offer.sourceType === "fixture");

  return (
    <SiteShell>
      <section className="section">
        <div className="toolbar">
          <WeekScopeSwitcher weekScope={weekScope} href="/offers" />
          <RefreshDataButton weekScope={weekScope} />
        </div>
        <div className="section-header">
          <div>
            <h3>Angebote</h3>
            <p>Aggregierte Prospekt-Angebote mit einheitlicher Filterung nach Markt, Kategorie und Preis.</p>
          </div>
          <div className="chip">{offers.length} Produkte</div>
        </div>

        {hasFixtureOffers ? (
          <div className="card" style={{ marginBottom: "1rem" }}>
            <h4>Hinweis zum Datenstand</h4>
            <p className="muted">
              Ein Teil dieser Angebote kommt aktuell aus Beispieldaten, nicht aus einem live geladenen Händler-Feed.
            </p>
          </div>
        ) : null}

        <OffersFilter retailers={RETAILERS} categories={categories} searchParams={resolvedSearchParams} />

        <div className="offers-grid">
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
