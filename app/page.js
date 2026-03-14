import { OfferCard } from "@/components/offer-card";
import { OffersFilter } from "@/components/offers-filter";
import { SiteShell } from "@/components/site-shell";
import { WeekScopeSwitcher } from "@/components/week-scope-switcher";
import { RefreshDataButton } from "@/components/refresh-data-button";
import { getDashboardData, listOffers, listCategories } from "@/lib/db";
import { RETAILERS } from "@/lib/constants";
import { formatDateRange } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const weekScope = resolvedSearchParams.week === "next" ? "next" : "current";
  const [{ retailers }, categories, offers] = await Promise.all([
    getDashboardData(weekScope),
    listCategories(weekScope),
    listOffers(resolvedSearchParams),
  ]);
  const weekLabel = weekScope === "next" ? "Nächste Woche" : "Diese Woche";

  return (
    <SiteShell>
      <div className="toolbar">
        <WeekScopeSwitcher weekScope={weekScope} href="/" />
        <RefreshDataButton weekScope={weekScope} />
      </div>
      <section className="section">
        <div className="section-header section-header--centered">
          <div className="eyebrow">{weekLabel}</div>
          <h3>Marktstatus</h3>
        </div>

        <div className="retailer-grid">
          {retailers.map((retailer) => {
            const originalHref =
              (retailer.sourceType === "live-lidl-api" || retailer.sourceType === "live-denns-page-data") && retailer.assetPath
                ? retailer.assetPath
                : retailer.sourceUrl;
            return (
              <article className="card retailer-card" key={retailer.slug} style={{ "--retailer-color": retailer.color }}>
                <div className="retailer-accent" />
                <img src={`/logos/${retailer.slug}.svg`} alt={retailer.name} className="retailer-logo" />
                <h4><span className="offer-count-num">{retailer.offerCount}</span><span className="offer-count-label">aktive Angebote</span></h4>
                <p className="muted">
                  {retailer.validFrom && retailer.validTo ? `Gültig ${formatDateRange(retailer.validFrom, retailer.validTo)}` : "Noch kein Prospekt"}
                </p>
                {originalHref ? (
                  <a href={originalHref} className="retailer-original-link" target="_blank" rel="noreferrer">
                    Prospekt ansehen ↗
                  </a>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="section section--separated" id="angebote">
        <div className="section-header section-header--centered">
          <div className="eyebrow">{offers.length} Produkte</div>
          <h3>Alle Angebote</h3>
        </div>

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
