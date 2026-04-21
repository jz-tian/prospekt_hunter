import { OfferCard } from "@/components/offer-card";
import { OffersFilter } from "@/components/offers-filter";
import { SiteShell } from "@/components/site-shell";
import { Signboard } from "@/components/signboard";
import { WeekScopeSwitcher } from "@/components/week-scope-switcher";
import { RefreshDataButton } from "@/components/refresh-data-button";
import { getDashboardData, listOffers, listCategories } from "@/lib/db";
import { RETAILERS } from "@/lib/constants";
import { formatDateRange } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const weekScope = resolvedSearchParams.week === "next" ? "next" : "current";
  const [{ retailers }, categories, offers] = await Promise.all([
    getDashboardData(weekScope),
    listCategories(weekScope),
    listOffers(resolvedSearchParams),
  ]);

  return (
    <SiteShell>
      {/* Intro row */}
      <div className="home-intro">
        <div>
          <div className="eyebrow">
            {weekScope === "next" ? "来週の特売 · Nächste Woche" : "今週の特売 · Diese Woche"}
          </div>
          <h1>Der Wochenmarkt der Rabatte</h1>
          <p className="home-sub">
            Fünf Händler, ein Schaufenster. Wählen Sie die Woche — füllen Sie den Korb.
          </p>
        </div>
        <WeekScopeSwitcher weekScope={weekScope} href="/" />
      </div>

      {/* Retailer stalls */}
      <Signboard jp="五 つ の 店" title="Händler im Markt" sub="Fünf Prospekte, täglich frisch abgegriffen" />
      <div className="stall-grid stagger">
        {retailers.map((retailer) => {
          const retailerDef = RETAILERS.find((r) => r.slug === retailer.slug);
          const colorClass = retailerDef?.colorClass ?? "";
          const jpText = retailerDef?.jp ?? "";
          const motto = retailerDef?.motto ?? "";
          const originalHref =
            (retailer.sourceType === "live-lidl-api" || retailer.sourceType === "live-denns-page-data") && retailer.assetPath
              ? retailer.assetPath
              : retailer.sourceUrl;

          return (
            <div key={retailer.slug} className={`stall ${colorClass}`}>
              <div className="noren">{jpText}</div>
              <div className="body">
                <div className="name">
                  <span className="jp">{motto}</span>
                  {retailer.name}
                </div>
                <div className="count">
                  {retailer.offerCount}
                  <span className="unit">件<br />ANGEB.</span>
                </div>
                <div className="validity">
                  <span>
                    {retailer.validFrom && retailer.validTo
                      ? formatDateRange(retailer.validFrom, retailer.validTo)
                      : "Noch kein Prospekt"}
                  </span>
                  {originalHref && (
                    <a className="stall-cta" href={originalHref} target="_blank" rel="noreferrer">
                      Prospekt →
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Offers section */}
      <div className="admin-bar">
        <div className="left">
          <Signboard jp="本 日 の 目 玉" title="Aktuelle Angebote" sub={`${offers.length} Angebote diese Woche`} />
        </div>
        <RefreshDataButton weekScope={weekScope} />
      </div>

      <OffersFilter retailers={RETAILERS} categories={categories} searchParams={resolvedSearchParams} />

      <div className="offers-meta-bar" style={{ marginTop: 14, fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "var(--muted)", letterSpacing: "0.15em" }}>
        <span>ANGEBOTE: {offers.length}</span>
        <Link href="/offers" style={{ background: "var(--text)", color: "var(--bg)", padding: "6px 14px", border: "2px solid var(--border)", boxShadow: "var(--shadow)", fontSize: 12, fontFamily: "Noto Serif JP, serif", fontWeight: 900, letterSpacing: "0.1em", textDecoration: "none" }}>
          Alle ansehen →
        </Link>
      </div>

      <div className="offers-wrap">
        <div className="offers-grid stagger">
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      </div>
    </SiteShell>
  );
}
