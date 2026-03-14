import { NextResponse } from "next/server";
import { listCategories } from "@/lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const weekScope = searchParams.get("week") === "next" ? "next" : "current";
  return NextResponse.json({ categories: await listCategories(weekScope) });
}
