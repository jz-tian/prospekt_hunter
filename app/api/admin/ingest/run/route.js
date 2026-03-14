import { NextResponse } from "next/server";
import { runIngestion } from "@/lib/ingest";

function isAuthorized(request) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  return request.headers.get("Authorization") === `Bearer ${password}`;
}

export async function POST(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const weekScope = searchParams.get("week") === "next" ? "next" : "current";
  const status = await runIngestion(weekScope);
  return NextResponse.json({ status });
}
