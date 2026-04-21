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
  const [offers, categories] = await Promise.all([
    listOffers(resolvedSearchParams),
    listCategories(weekScope),
  ]);

  const topDiscount = offers.length > 0 ? Math.max(...offers.map((o) => {
    if (o.originalPrice && o.salePrice) return Math.round((1 - o.salePrice / o.originalPrice) * 100);
    return 0;
  })) : 0;

  return (
    <SiteShell>
      <div className="page-hero">
        <div className="lead">
          <h1>
            <span className="jp">特売 一覧 · ANGEBOTE</span>
            Alle Angebote dieser Woche
          </h1>
          <p>Durchsuchen, vergleichen, sammeln. Filtern Sie nach Händler, Kategorie oder dem größten Rabatt — und legen Sie alles in Ihren Korb.</p>
        </div>
        <div className="stats">
          <div className="stat">
            <div className="n">{offers.length}</div>
            <div className="l">Angebote</div>
          </div>
          <div className="stat">
            <div className="n">5</div>
            <div className="l">Händler</div>
          </div>
          {topDiscount > 0 && (
            <div className="stat">
              <div className="n">−{topDiscount}%</div>
              <div className="l">Top-Rabatt</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "14px 0 0", flexWrap: "wrap", gap: 12 }}>
        <WeekScopeSwitcher weekScope={weekScope} href="/offers" />
        <RefreshDataButton weekScope={weekScope} />
      </div>

      <OffersFilter retailers={RETAILERS} categories={categories} searchParams={resolvedSearchParams} />

      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "var(--muted)", letterSpacing: "0.12em", margin: "14px 0 10px" }}>
        ERGEBNIS: {offers.length} ANGEBOTE ◆ ◆ ◆
      </div>

      {offers.length === 0 ? (
        <div className="empty-state">
          <p>Keine Angebote gefunden — passen Sie die Filter an.</p>
        </div>
      ) : (
        <div className="offers-wrap">
          <div className="offers-grid stagger">
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        </div>
      )}
    </SiteShell>
  );
}
