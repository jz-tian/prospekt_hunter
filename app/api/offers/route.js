import { NextResponse } from "next/server";
import { listOffers } from "@/lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const weekScope = searchParams.get("week") === "next" ? "next" : "current";
  const offers = await listOffers({
    week: weekScope,
    retailer: searchParams.get("retailer") || "",
    category: searchParams.get("category") || "",
    search: searchParams.get("search") || "",
    sort: searchParams.get("sort") || "",
  });

  return NextResponse.json({ offers });
}
