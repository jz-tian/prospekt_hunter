import { NextResponse } from "next/server";
import { deleteShoppingItem, listShoppingItems, updateShoppingItem } from "@/lib/db";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const item = await updateShoppingItem(Number(id), {
    quantity: body.quantity !== undefined ? Number(body.quantity) : undefined,
    note: body.note,
    checked: body.checked !== undefined ? Number(body.checked) : undefined,
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json({ items: await listShoppingItems() });
}

export async function DELETE(_request, { params }) {
  const { id } = await params;
  await deleteShoppingItem(Number(id));
  return NextResponse.json({ items: await listShoppingItems() });
}
