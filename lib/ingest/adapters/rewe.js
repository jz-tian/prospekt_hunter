import { getFixtureForWeek } from "@/lib/sample-data";

export async function fetchReweProspekt(weekScope = "current") {
  return getFixtureForWeek("rewe", weekScope);
}
