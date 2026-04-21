"use client";

import { useEffect, useState } from "react";

export function CartHeaderButton() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function refresh() {
      try {
        const res = await fetch("/api/shopping-list", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setCount(data.items.reduce((sum, item) => sum + item.quantity, 0));
      } catch {
        // ignore
      }
    }

    refresh();
    window.addEventListener("shopping-list-updated", refresh);
    return () => window.removeEventListener("shopping-list-updated", refresh);
  }, []);

  function handleClick() {
    window.dispatchEvent(new CustomEvent("toggle-shopping-drawer"));
  }

  return (
    <button type="button" className="basket-btn" onClick={handleClick} aria-label="Einkaufsliste öffnen">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M3 8h18l-2 11H5L3 8z"/>
        <path d="M3 8l3-4 4 4 M21 8l-3-4-4 4"/>
        <path d="M9 12v4 M15 12v4 M12 12v4"/>
      </svg>
      <span>Korb</span>
      <span className="count">{count}</span>
    </button>
  );
}
