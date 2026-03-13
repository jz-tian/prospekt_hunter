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
    <button type="button" className="cart-header-btn" onClick={handleClick} aria-label="Einkaufsliste öffnen">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
      {count > 0 && <span className="cart-header-count">{count}</span>}
    </button>
  );
}
