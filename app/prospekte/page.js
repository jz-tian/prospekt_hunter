import Link from "next/link";
import { RefreshDataButton } from "@/components/refresh-data-button";
import { Signboard } from "@/components/signboard";
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
      <div className="page-hero">
        <div className="lead">
          <h1>
            <span className="jp">広 告 集 · PROSPEKTE</span>
            Wochenprospekte
          </h1>
          <p>Die gesammelten Handzettel der Woche — wie der alte Prospekt-Stapel im Briefkasten, nur ohne Papier.</p>
        </div>
        <div className="stats">
          <div className="stat">
            <div className="n">{prospekte.length}</div>
            <div className="l">Hefte</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "14px 0 0", flexWrap: "wrap", gap: 12 }}>
        <WeekScopeSwitcher weekScope={weekScope} href="/prospekte" />
        <RefreshDataButton weekScope={weekScope} />
      </div>

      <Signboard jp="今 週 の 広 告" title="Aktuelle Prospekte" sub="Klicken Sie auf ein Heft, um die Angebote zu öffnen" />

      {prospekte.length === 0 ? (
        <div className="empty-state">
          <p>Für diese Woche ist noch kein Prospekt veröffentlicht.</p>
        </div>
      ) : (
        <div className="prospekt-grid stagger">
          {prospekte.map((prospekt) => {
            const pdfHref =
              (prospekt.sourceType === "live-lidl-api" || prospekt.sourceType === "live-denns-page-data") && prospekt.assetPath
                ? prospekt.assetPath
                : prospekt.sourceUrl;

            return (
              <div key={prospekt.id} className="prospekt">
                <span className="c3" /><span className="c4" />
                <div className="cover">
                  {isCoverImage(prospekt.assetPath) ? (
                    <img src={prospekt.assetPath} alt={prospekt.title} />
                  ) : (
                    <div className="cover-label">
                      <span className="w">{prospekt.retailerName}</span>
                      <span className="s">広告</span>
                    </div>
                  )}
                </div>
                <h3>{prospekt.title}</h3>
                <div className="meta">Gültig {formatDateRange(prospekt.validFrom, prospekt.validTo)}</div>
                <div className="prospekt-actions">
                  {pdfHref && (
                    <a className="view-btn" href={pdfHref} target="_blank" rel="noreferrer">
                      {prospekt.sourceType === "live-lidl-api" || prospekt.sourceType === "live-denns-page-data" ? "PDF →" : "Original →"}
                    </a>
                  )}
                  <Link className="view-btn" href={`/offers?week=${weekScope}&retailer=${prospekt.retailerSlug}`}>
                    Angebote →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SiteShell>
  );
}
