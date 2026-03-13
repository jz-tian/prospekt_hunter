import { NextResponse } from "next/server";
import { getOfferById } from "@/lib/db";

export async function GET(_request, { params }) {
  const { id } = await params;
  const offer = getOfferById(id);

  if (!offer) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  }

  return NextResponse.json({ offer });
}
