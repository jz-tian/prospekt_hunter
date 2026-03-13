import Link from "next/link";
import { OfferCard } from "@/components/offer-card";
import { SiteShell } from "@/components/site-shell";
import { WeekScopeSwitcher } from "@/components/week-scope-switcher";
import { RefreshDataButton } from "@/components/refresh-data-button";
import { getDashboardData } from "@/lib/db";
import { formatDateRange } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const weekScope = resolvedSearchParams.week === "next" ? "next" : "current";
  const { retailers, featuredOffers, categories, stats } = getDashboardData(weekScope);
  const weekLabel = weekScope === "next" ? "Nächste Woche" : "Diese Woche";

  return (
    <SiteShell>
      <div className="toolbar">
        <WeekScopeSwitcher weekScope={weekScope} href="/" />
        <RefreshDataButton weekScope={weekScope} />
      </div>
      <section className="hero">
        <div className="hero-panel">
          <div className="eyebrow">{weekLabel}</div>
          <h2>Alle Deals.<br />Ein Blick.</h2>
          <p>
            RabattHunter bündelt die aktuellen Wochenangebote von ALDI, Lidl, Denns, NORMA und EDEKA —
            kategorisiert, gefiltert, auf einen Blick.
          </p>
          <div className="hero-actions">
            <Link href={`/offers?week=${weekScope}`} className="cta">
              Angebote ansehen
            </Link>
            <Link href={`/prospekte?week=${weekScope}`} className="ghost-button hero-ghost">
              Prospekte prüfen
            </Link>
          </div>
        </div>

        <div className="hero-stats">
          <div className="stat">
            Märkte
            <strong>{stats.retailerCount}</strong>
          </div>
          <div className="stat">
            Prospekte
            <strong>{stats.prospektCount}</strong>
          </div>
          <div className="stat">
            Angebote
            <strong>{stats.offerCount}</strong>
          </div>
          <div className="stat">
            Review nötig
            <strong>{stats.reviewCount}</strong>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <h3>Marktstatus</h3>
            <p>Jeder Markt zeigt die aktive Prospekt-Woche und die aktuell erkannten Angebote.</p>
          </div>
        </div>

        <div className="retailer-grid">
          {retailers.map((retailer) => (
            <article className="card retailer-card" key={retailer.slug}>
              <div className="retailer-accent" style={{ background: retailer.color }} />
              <span className="retailer-pill">{retailer.name}</span>
              <h4>{retailer.offerCount} aktive Angebote</h4>
              <p className="muted">
                {retailer.validFrom && retailer.validTo ? `Gültig ${formatDateRange(retailer.validFrom, retailer.validTo)}` : "Noch kein Prospekt"}
              </p>
              <p className="muted">{retailer.prospektCount} Prospekt erfasst</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <h3>Alle Produkte</h3>
            <p>Feinere Kategorien für bessere Orientierung zwischen Vorrat, Getränken, Snacks, Haushalt und Frische.</p>
          </div>
          <Link href={`/offers?week=${weekScope}`} className="ghost-button">
            Zur Angebotsliste
          </Link>
        </div>

        <div className="category-grid">
          {categories.map((category) => (
            <Link
              href={`/offers?week=${weekScope}&category=${category.slug}`}
              className="category-card"
              key={category.slug}
              style={{ background: category.tone, color: category.textColor }}
            >
              <div style={{ fontSize: "2rem", lineHeight: 1 }}>{category.emoji ?? "🛒"}</div>
              <div>
                <h4>{category.name}</h4>
                <p>{category.offerCount} Angebote</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <h3>Preiswerte Funde</h3>
            <p>Eine Auswahl aktueller Prospekt-Angebote aus den laufenden Wochenaktionen.</p>
          </div>
        </div>

        <div className="offers-grid">
          {featuredOffers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      </section>

      <p className="footer-note">
        Daten werden aus der lokalen Datenbank gelesen. Mit "Daten aktualisieren" startest du einen manuellen Ingest gegen die
        offiziellen Quellen aller fünf Händler. Denns läuft dabei direkt über die offizielle Angebotsseite mit strukturierter page-data.
      </p>
    </SiteShell>
  );
}
