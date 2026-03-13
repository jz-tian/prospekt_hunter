import { NextResponse } from "next/server";
import { reparseOffers } from "@/lib/ingest";

export async function POST() {
  const status = await reparseOffers();
  return NextResponse.json({ status });
}
