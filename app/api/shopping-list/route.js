import { NextResponse } from "next/server";
import { addShoppingItem, clearShoppingItems, listShoppingItems } from "@/lib/db";

export async function GET() {
  return NextResponse.json({ items: listShoppingItems() });
}

export async function POST(request) {
  const body = await request.json();

  if (!body.offerId) {
    return NextResponse.json({ error: "offerId is required" }, { status: 400 });
  }

  addShoppingItem(Number(body.offerId), Number(body.quantity ?? 1), body.note ?? "");
  return NextResponse.json({ items: listShoppingItems() }, { status: 201 });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const retailer = searchParams.get("retailer");

  clearShoppingItems(retailer || null);
  return NextResponse.json({ items: listShoppingItems() });
}
