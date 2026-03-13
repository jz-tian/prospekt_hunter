"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatEuro } from "@/lib/format";

async function fetchList() {
  const response = await fetch("/api/shopping-list", { cache: "no-store" });

  if (!response.ok) {
    return { items: [] };
  }

  return response.json();
}

function buildGroupedSummaries(items) {
  const grouped = items.reduce((accumulator, item) => {
    accumulator[item.retailerName] ??= [];
    accumulator[item.retailerName].push(item);
    return accumulator;
  }, {});

  return Object.entries(grouped).map(([retailerName, retailerItems]) => ({
    retailerName,
    retailerSlug: retailerItems[0]?.retailerSlug,
    items: retailerItems,
    quantity: retailerItems.reduce((sum, item) => sum + item.quantity, 0),
    total: retailerItems.reduce((sum, item) => sum + item.salePrice * item.quantity, 0)
  }));
}

export function ShoppingListDrawer() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const payload = await fetchList();
    setItems(payload.items);
  }

  useEffect(() => {
    refresh();

    function handleUpdate() {
      refresh();
    }

    function handleToggle() {
      setOpen((v) => !v);
    }

    window.addEventListener("shopping-list-updated", handleUpdate);
    window.addEventListener("toggle-shopping-drawer", handleToggle);
    return () => {
      window.removeEventListener("shopping-list-updated", handleUpdate);
      window.removeEventListener("toggle-shopping-drawer", handleToggle);
    };
  }, []);

  const summaries = useMemo(() => buildGroupedSummaries(items), [items]);
  const total = useMemo(() => items.reduce((sum, item) => sum + item.salePrice * item.quantity, 0), [items]);
  const count = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  async function mutateItem(id, payload) {
    setBusy(true);
    await fetch(`/api/shopping-list/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    await refresh();
    setBusy(false);
    window.dispatchEvent(new CustomEvent("shopping-list-updated"));
  }

  async function removeItem(id) {
    setBusy(true);
    await fetch(`/api/shopping-list/${id}`, { method: "DELETE" });
    await refresh();
    setBusy(false);
    window.dispatchEvent(new CustomEvent("shopping-list-updated"));
  }

  async function clearItems(retailerSlug = "") {
    setBusy(true);
    const suffix = retailerSlug ? `?retailer=${encodeURIComponent(retailerSlug)}` : "";
    await fetch(`/api/shopping-list${suffix}`, { method: "DELETE" });
    await refresh();
    setBusy(false);
    window.dispatchEvent(new CustomEvent("shopping-list-updated"));
  }

  return (
    <aside id="shopping-list-drawer" className={`shopping-drawer ${open ? "open" : ""}`} aria-hidden={!open}>
      <div className="shopping-drawer-panel">
        <div className="shopping-drawer-header">
          <div>
            <div className="drawer-eyebrow">Einkaufsliste</div>
            <h3 style={{ margin: "4px 0 0", fontSize: "1.1rem", fontWeight: 600 }}>
              {count} {count === 1 ? "Artikel" : "Artikel"}
            </h3>
          </div>
          <button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="Schließen">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="shopping-drawer-summary card">
          <div className="info-row">
            <span>Artikel</span>
            <strong>{count}</strong>
          </div>
          <div className="info-row">
            <span>Märkte</span>
            <strong>{summaries.length}</strong>
          </div>
          <div className="info-row">
            <span>Gesamt</span>
            <strong>{formatEuro(total)}</strong>
          </div>
        </div>

        <div className="shopping-drawer-actions">
          <Link href="/shopping-list" className="ghost-button" onClick={() => setOpen(false)}>
            Vollansicht
          </Link>
          <button type="button" className="ghost-button" onClick={() => clearItems()} disabled={busy || items.length === 0}>
            Alles leeren
          </button>
        </div>

        <div className="shopping-drawer-body">
          {items.length === 0 ? (
            <div className="card empty-state">
              <h4>Liste leer</h4>
              <p className="muted">Füge Angebote hinzu, um sie hier zu planen.</p>
            </div>
          ) : (
            summaries.map((summary) => (
              <section className="card shopping-drawer-group" key={summary.retailerName}>
                <div className="shopping-drawer-group-header">
                  <div>
                    <strong style={{ fontSize: "0.875rem" }}>{summary.retailerName}</strong>
                    <div className="muted" style={{ fontSize: "0.78rem" }}>{summary.quantity} Stück · {formatEuro(summary.total)}</div>
                  </div>
                  <button
                    type="button"
                    className="ghost-button compact-button"
                    onClick={() => clearItems(summary.retailerSlug)}
                    disabled={busy}
                  >
                    Leeren
                  </button>
                </div>

                {summary.items.map((item) => (
                  <div className={`shopping-drawer-item ${item.checked ? "done" : ""}`} key={item.id}>
                    <input
                      type="checkbox"
                      checked={Boolean(item.checked)}
                      onChange={(e) => mutateItem(item.id, { checked: e.target.checked ? 1 : 0 })}
                    />
                    <div className="shopping-drawer-copy">
                      <div className="shopping-name" style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                        {item.productName}
                      </div>
                      <div className="muted" style={{ fontSize: "0.78rem" }}>
                        {formatEuro(item.salePrice)} · {item.quantity}×
                      </div>
                    </div>
                    <div className="shopping-drawer-item-actions">
                      <button className="icon-button" type="button" onClick={() => mutateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })} disabled={busy} aria-label="Menge verringern">−</button>
                      <button className="icon-button" type="button" onClick={() => mutateItem(item.id, { quantity: item.quantity + 1 })} disabled={busy} aria-label="Menge erhöhen">+</button>
                      <button className="icon-button" type="button" onClick={() => removeItem(item.id)} disabled={busy} aria-label="Entfernen">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                          <path d="M18 6 6 18M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </section>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
