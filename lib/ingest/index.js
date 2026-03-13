import { completeIngestRun, createIngestRun, getIngestStatus, replaceIssueData } from "@/lib/db";
import { fetchAldiProspekt } from "@/lib/ingest/adapters/aldi";
import { fetchLidlProspekt } from "@/lib/ingest/adapters/lidl";
import { fetchDennsProspekt } from "@/lib/ingest/adapters/denns";
import { fetchEdekaProspekt } from "@/lib/ingest/adapters/edeka";

const adapters = {
  aldi: fetchAldiProspekt,
  lidl: fetchLidlProspekt,
  denns: fetchDennsProspekt,
  edeka: fetchEdekaProspekt
};

export async function runIngestion(weekScope = "current") {
  const runId = createIngestRun("running", `Automatischer Ingest für ${weekScope} gestartet.`);
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

      replaceIssueData(slug, payload.issue, payload.offers);
      updatedRetailers.push(slug.toUpperCase());
    }

    const detailParts = [];
    if (updatedRetailers.length > 0) {
      detailParts.push(`${updatedRetailers.join(", ")} aktualisiert`);
    }
    if (unavailableRetailers.length > 0) {
      detailParts.push(`${unavailableRetailers.join(", ")} nicht verfügbar`);
    }

    const detail =
      detailParts.length > 0
        ? `Automatischer Ingest für ${weekScope} abgeschlossen: ${detailParts.join("; ")}.`
        : `Automatischer Ingest für ${weekScope} abgeschlossen: keine neuen Quelldaten verfügbar.`;
    completeIngestRun(runId, "success", detail);
    return getIngestStatus();
  } catch (error) {
    completeIngestRun(runId, "failed", error.message);
    throw error;
  }
}

export async function reparseOffers() {
  const runId = createIngestRun("running", "Reparse für bestehende Angebotsdaten gestartet.");
  completeIngestRun(runId, "success", "Für die Demo entspricht Reparse dem bestehenden Seed-Zustand.");
  return getIngestStatus();
}
