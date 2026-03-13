import { NextResponse } from "next/server";
import { deleteShoppingItem, listShoppingItems, updateShoppingItem } from "@/lib/db";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const item = updateShoppingItem(Number(id), {
    quantity: body.quantity !== undefined ? Number(body.quantity) : undefined,
    note: body.note,
    checked: body.checked !== undefined ? Number(body.checked) : undefined
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json({ items: listShoppingItems() });
}

export async function DELETE(_request, { params }) {
  const { id } = await params;
  deleteShoppingItem(Number(id));
  return NextResponse.json({ items: listShoppingItems() });
}
