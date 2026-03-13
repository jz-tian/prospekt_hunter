import { completeIngestRun, createIngestRun, getIngestStatus, replaceFixtureData } from "@/lib/db";
import { fetchAldiProspekt } from "@/lib/ingest/adapters/aldi";
import { fetchLidlProspekt } from "@/lib/ingest/adapters/lidl";
import { fetchReweProspekt } from "@/lib/ingest/adapters/rewe";
import { fetchEdekaProspekt } from "@/lib/ingest/adapters/edeka";

const adapters = {
  aldi: fetchAldiProspekt,
  lidl: fetchLidlProspekt,
  rewe: fetchReweProspekt,
  edeka: fetchEdekaProspekt
};

export async function runIngestion(weekScope = "current") {
  const runId = createIngestRun("running", `Automatischer Ingest für ${weekScope} gestartet.`);

  try {
    for (const [slug, adapter] of Object.entries(adapters)) {
      const payload = await adapter(weekScope);
      if (!payload) {
        continue;
      }
      replaceFixtureData(slug, payload.issue, payload.offers);
    }

    completeIngestRun(runId, "success", `Automatischer Ingest für ${weekScope} abgeschlossen.`);
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
