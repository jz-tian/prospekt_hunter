import { completeIngestRun, createIngestRun, getIngestStatus, reclassifyOffers, replaceIssueData } from "@/lib/db";
import { fetchAldiProspekt } from "@/lib/ingest/adapters/aldi";
import { fetchLidlProspekt } from "@/lib/ingest/adapters/lidl";
import { fetchDennsProspekt } from "@/lib/ingest/adapters/denns";
import { fetchNormaProspekt } from "@/lib/ingest/adapters/norma";
import { fetchEdekaProspekt } from "@/lib/ingest/adapters/edeka";

const adapters = {
  aldi: fetchAldiProspekt,
  lidl: fetchLidlProspekt,
  denns: fetchDennsProspekt,
  norma: fetchNormaProspekt,
  edeka: fetchEdekaProspekt,
};

export async function runIngestion(weekScope = "current") {
  const runId = await createIngestRun("running", `Automatischer Ingest für ${weekScope} gestartet.`);
  const updatedRetailers = [];
  const unavailableRetailers = [];

  try {
    for (const [slug, adapter] of Object.entries(adapters)) {
      let payload = null;

      try {
        payload = await adapter(weekScope);
      } catch (error) {
        unavailableRetailers.push(`${slug.toUpperCase()} (${error.message})`);
        continue;
      }

      if (!payload) {
        unavailableRetailers.push(slug.toUpperCase());
        continue;
      }

      await replaceIssueData(slug, payload.issue, payload.offers);
      updatedRetailers.push(slug.toUpperCase());
    }

    const detailParts = [];
    if (updatedRetailers.length > 0) detailParts.push(`${updatedRetailers.join(", ")} aktualisiert`);
    if (unavailableRetailers.length > 0) detailParts.push(`${unavailableRetailers.join(", ")} nicht verfügbar`);

    const detail = detailParts.length > 0
      ? `Automatischer Ingest für ${weekScope} abgeschlossen: ${detailParts.join("; ")}.`
      : `Automatischer Ingest für ${weekScope} abgeschlossen: keine neuen Quelldaten verfügbar.`;

    await completeIngestRun(runId, "success", detail);
    return await getIngestStatus();
  } catch (error) {
    await completeIngestRun(runId, "failed", error.message);
    throw error;
  }
}

export async function reparseOffers() {
  const runId = await createIngestRun("running", "Reparse für bestehende Angebotsdaten gestartet.");
  await reclassifyOffers();
  await completeIngestRun(runId, "success", "Bestehende Angebotsdaten wurden mit den aktuellen Kategorien neu zugeordnet.");
  return await getIngestStatus();
}
