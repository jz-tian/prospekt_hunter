"use client";

import { useEffect, useState } from "react";
import { formatEuro } from "@/lib/format";

async function fetchList() {
  const response = await fetch("/api/shopping-list", { cache: "no-store" });
  return response.json();
}

export function ShoppingListClient({ initialItems }) {
  const [items, setItems] = useState(initialItems);

  useEffect(() => {
    async function refresh() {
      const next = await fetchList();
      setItems(next.items);
    }

    function handleUpdate() {
      refresh();
    }

    window.addEventListener("shopping-list-updated", handleUpdate);
    return () => window.removeEventListener("shopping-list-updated", handleUpdate);
  }, []);

  async function mutateItem(id, payload) {
    await fetch(`/api/shopping-list/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const next = await fetchList();
    setItems(next.items);
  }

  async function removeItem(id) {
    await fetch(`/api/shopping-list/${id}`, {
      method: "DELETE"
    });

    const next = await fetchList();
    setItems(next.items);
  }

  const grouped = items.reduce((accumulator, item) => {
    accumulator[item.retailerName] ??= [];
    accumulator[item.retailerName].push(item);
    return accumulator;
  }, {});

  const total = items.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);

  return (
    <div className="shopping-layout">
      <section className="shopping-list">
        {items.length === 0 ? (
          <div className="card empty-state">
            <h3>Die Einkaufsliste ist leer.</h3>
            <p className="muted">Füge Angebote aus der Übersicht hinzu, um dir einen Wocheneinkauf zusammenzustellen.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([retailerName, retailerItems]) => (
            <div className="panel" key={retailerName} style={{ padding: 18 }}>
              <div className="section-header">
                <div>
                  <h3>{retailerName}</h3>
                  <p>{retailerItems.length} Artikel</p>
                </div>
              </div>
              {retailerItems.map((item) => (
                <div className={`card shopping-item ${item.checked ? "done" : ""}`} key={item.id}>
                  <input
                    type="checkbox"
                    checked={Boolean(item.checked)}
                    onChange={(event) => mutateItem(item.id, { checked: event.target.checked ? 1 : 0 })}
                  />
                  <div>
                    <div className="shopping-name">
                      <strong>{item.productName}</strong>
                    </div>
                    <div className="muted">{formatEuro(item.salePrice)}</div>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div className="quantity-controls">
                      <button className="icon-button" type="button" onClick={() => mutateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}>
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button className="icon-button" type="button" onClick={() => mutateItem(item.id, { quantity: item.quantity + 1 })}>
                        +
                      </button>
                    </div>
                    <button className="ghost-button" type="button" onClick={() => removeItem(item.id)}>
                      Entfernen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </section>

      <aside className="panel" style={{ padding: 24, alignSelf: "start" }}>
        <div className="eyebrow">Liste</div>
        <h3 style={{ marginBottom: 8 }}>Wochensumme</h3>
        <p className="muted">Eine einfache Einkaufsliste ohne Checkout. Ideal, um Prospekt-Angebote zu planen.</p>
        <div className="info-list" style={{ marginTop: 18 }}>
          <div className="info-row">
            <span>Artikel</span>
            <strong>{items.reduce((sum, item) => sum + item.quantity, 0)}</strong>
          </div>
          <div className="info-row">
            <span>Märkte</span>
            <strong>{Object.keys(grouped).length}</strong>
          </div>
          <div className="info-row">
            <span>Schätzkosten</span>
            <strong>{formatEuro(total)}</strong>
          </div>
        </div>
      </aside>
    </div>
  );
}
