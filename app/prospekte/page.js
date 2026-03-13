import Link from "next/link";
import { RefreshDataButton } from "@/components/refresh-data-button";
import { SiteShell } from "@/components/site-shell";
import { WeekScopeSwitcher } from "@/components/week-scope-switcher";
import { listProspekte } from "@/lib/db";
import { formatDateRange } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProspektePage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const weekScope = resolvedSearchParams.week === "next" ? "next" : "current";
  const prospekte = listProspekte(weekScope);

  return (
    <SiteShell>
      <section className="section">
        <div className="toolbar">
          <WeekScopeSwitcher weekScope={weekScope} href="/prospekte" />
          <RefreshDataButton weekScope={weekScope} />
        </div>
        <div className="section-header">
          <div>
            <h3>Prospekte</h3>
            <p>Wochenhefte je Händler mit Gültigkeit, Quelle und Anzahl der erkannten Angebote.</p>
          </div>
        </div>

        <div className="prospekt-grid">
          {prospekte.map((prospekt) => (
            <article className="card prospekt-card" key={prospekt.id}>
              <div className="retailer-accent" style={{ background: prospekt.retailerColor }} />
              <span className="retailer-pill">{prospekt.retailerName}</span>
              <h4>{prospekt.title}</h4>
              <p className="muted">Gültig {formatDateRange(prospekt.validFrom, prospekt.validTo)}</p>
              <p className="muted">{prospekt.offerCount} Angebote erkannt</p>
              <p className="muted">Quelle: {prospekt.sourceType}</p>
              <div className="hero-actions">
                <a
                  href={prospekt.sourceType === "live-lidl-api" && prospekt.assetPath ? prospekt.assetPath : prospekt.sourceUrl}
                  className="ghost-button"
                  target="_blank"
                  rel="noreferrer"
                >
                  {prospekt.sourceType === "live-lidl-api" ? "PDF öffnen" : "Original ansehen"}
                </a>
                <Link href={`/offers?week=${weekScope}&retailer=${prospekt.retailerSlug}`} className="cta">
                  Angebote
                </Link>
              </div>
            </article>
          ))}
        </div>
        {prospekte.length === 0 ? (
          <div className="card empty-state">
            <h3>Für diese Woche ist noch kein Prospekt veröffentlicht.</h3>
          </div>
        ) : null}
      </section>
    </SiteShell>
  );
}
