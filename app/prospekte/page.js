import Link from "next/link";
import { RefreshDataButton } from "@/components/refresh-data-button";
import { SiteShell } from "@/components/site-shell";
import { WeekScopeSwitcher } from "@/components/week-scope-switcher";
import { listProspekte } from "@/lib/db";
import { formatDateRange } from "@/lib/format";

export const dynamic = "force-dynamic";

function isCoverImage(assetPath) {
  return assetPath && /\.(jpe?g|png|webp|avif|gif)(\?|$)/i.test(assetPath);
}

export default async function ProspektePage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const weekScope = resolvedSearchParams.week === "next" ? "next" : "current";
  const prospekte = await listProspekte(weekScope);

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
            <article className="card prospekt-card" key={prospekt.id} style={{ "--retailer-color": prospekt.retailerColor }}>
              <div className="retailer-accent" />
              {isCoverImage(prospekt.assetPath) ? (
                <img src={prospekt.assetPath} alt={prospekt.title} className="prospekt-cover-img" />
              ) : (
                <div className="prospekt-cover-placeholder">
                  <img src={`/logos/${prospekt.retailerSlug}.svg`} alt={prospekt.retailerName} className="prospekt-cover-logo" />
                </div>
              )}
              <div className="prospekt-card-body">
                <img src={`/logos/${prospekt.retailerSlug}.svg`} alt={prospekt.retailerName} className="retailer-logo" />
                <h4>{prospekt.title}</h4>
                <p className="muted">Gültig {formatDateRange(prospekt.validFrom, prospekt.validTo)}</p>
                <div className="hero-actions">
                  <a
                    href={
                      (prospekt.sourceType === "live-lidl-api" || prospekt.sourceType === "live-denns-page-data") && prospekt.assetPath
                        ? prospekt.assetPath
                        : prospekt.sourceUrl
                    }
                    className="ghost-button"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {prospekt.sourceType === "live-lidl-api" || prospekt.sourceType === "live-denns-page-data" ? "PDF öffnen" : "Original ansehen"}
                  </a>
                  <Link href={`/offers?week=${weekScope}&retailer=${prospekt.retailerSlug}`} className="cta">
                    Angebote
                  </Link>
                </div>
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
