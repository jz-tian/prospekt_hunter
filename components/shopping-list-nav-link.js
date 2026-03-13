"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

async function fetchShoppingListCount() {
  const response = await fetch("/api/shopping-list", { cache: "no-store" });

  if (!response.ok) {
    return 0;
  }

  const payload = await response.json();
  return payload.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function ShoppingListNavLink() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function refresh() {
      setCount(await fetchShoppingListCount());
    }

    refresh();
    window.addEventListener("shopping-list-updated", refresh);
    return () => window.removeEventListener("shopping-list-updated", refresh);
  }, []);

  return (
    <Link href="/shopping-list" className="nav-link nav-link-count">
      Einkaufsliste
      <span className="nav-count">{count}</span>
    </Link>
  );
}
