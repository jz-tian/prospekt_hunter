import { NextResponse } from "next/server";
import { getIngestStatus } from "@/lib/db";

export async function GET() {
  return NextResponse.json({ status: getIngestStatus() });
}
