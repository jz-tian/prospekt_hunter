import { NextResponse } from "next/server";
import { runIngestion } from "@/lib/ingest";

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const weekScope = searchParams.get("week") === "next" ? "next" : "current";
  const status = await runIngestion(weekScope);
  return NextResponse.json({ status });
}
