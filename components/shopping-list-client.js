"use client";

import { useEffect, useState } from "react";
import { formatEuro } from "@/lib/format";

async function fetchList() {
  const response = await fetch("/api/shopping-list", { cache: "no-store" });
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
    items: retailerItems,
    quantity: retailerItems.reduce((sum, item) => sum + item.quantity, 0),
    total: retailerItems.reduce((sum, item) => sum + item.salePrice * item.quantity, 0)
  }));
}

export function ShoppingListClient({ initialItems }) {
  const [items, setItems] = useState(initialItems);
  const [exportStatus, setExportStatus] = useState("");

  useEffect(() => {
    async function refresh() {
      const next = await fetchList();
      setItems(next.items);
    }

    refresh();

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
    window.dispatchEvent(new CustomEvent("shopping-list-updated"));
  }

  async function removeItem(id) {
    await fetch(`/api/shopping-list/${id}`, {
      method: "DELETE"
    });

    const next = await fetchList();
    setItems(next.items);
    window.dispatchEvent(new CustomEvent("shopping-list-updated"));
  }

  const total = items.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);
  const retailerSummaries = buildGroupedSummaries(items);
  const retailerCount = retailerSummaries.length;

  function buildPlainTextExport() {
    const lines = ["Einkaufsliste", ""];

    for (const summary of retailerSummaries) {
      lines.push(`${summary.retailerName} · ${formatEuro(summary.total)}`);

      for (const item of summary.items) {
        lines.push(`${item.checked ? "☑" : "☐"} ${item.quantity}x ${item.productName} (${formatEuro(item.salePrice)})`);
      }

      lines.push("");
    }

    lines.push(`Gesamtsumme: ${formatEuro(total)}`);
    return lines.join("\n");
  }

  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = filename;
    anchor.click();

    URL.revokeObjectURL(url);
  }

  async function copyPlainTextExport() {
    const content = buildPlainTextExport();

    try {
      await navigator.clipboard.writeText(content);
      setExportStatus("Textliste kopiert");
    } catch {
      setExportStatus("Kopieren fehlgeschlagen");
    }
  }

  function downloadCsvExport() {
    const rows = [
      ["Retailer", "Status", "Product", "Quantity", "Unit Price", "Line Total", "Checked"],
      ...items.map((item) => [
        item.retailerName,
        item.checked ? "done" : "open",
        item.productName,
        String(item.quantity),
        item.salePrice.toFixed(2),
        (item.salePrice * item.quantity).toFixed(2),
        item.checked ? "yes" : "no"
      ])
    ];

    const content = rows
      .map((row) => row.map((value) => `"${String(value).replaceAll("\"", "\"\"")}"`).join(","))
      .join("\n");

    downloadFile("einkaufsliste.csv", content, "text/csv;charset=utf-8");
    setExportStatus("CSV exportiert");
  }

  function downloadTextExport() {
    downloadFile("einkaufsliste.txt", buildPlainTextExport(), "text/plain;charset=utf-8");
    setExportStatus("Textdatei exportiert");
  }

  async function exportToNotes() {
    const response = await fetch("/api/shopping-list/export-notes", {
      method: "POST"
    });

    const payload = await response.json();
    setExportStatus(payload.message ?? (response.ok ? "An Notizen exportiert" : "Export fehlgeschlagen"));
  }

  async function exportToReminders() {
    const response = await fetch("/api/shopping-list/export-reminders", {
      method: "POST"
    });

    const payload = await response.json();
    setExportStatus(payload.message ?? (response.ok ? "In Erinnerungen exportiert" : "Export fehlgeschlagen"));
  }

  return (
    <div className="shopping-layout">
      <section className="shopping-list">
        {items.length === 0 ? (
          <div className="card empty-state">
            <h3>Die Einkaufsliste ist leer.</h3>
            <p className="muted">Füge Angebote aus der Übersicht hinzu, um dir einen Wocheneinkauf zusammenzustellen.</p>
          </div>
        ) : (
          retailerSummaries.map((summary) => (
            <div className="panel" key={summary.retailerName} style={{ padding: 18 }}>
              <div className="section-header">
                <div>
                  <h3>{summary.retailerName}</h3>
                  <p>{summary.quantity} Stück · {summary.items.length} Positionen</p>
                </div>
                <div className="chip">Summe {formatEuro(summary.total)}</div>
              </div>
              {summary.items.map((item) => (
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
            <strong>{retailerCount}</strong>
          </div>
          <div className="info-row">
            <span>Schätzkosten</span>
            <strong>{formatEuro(total)}</strong>
          </div>
        </div>
        {retailerSummaries.length > 0 ? (
          <div className="retailer-summary-list">
            {retailerSummaries.map((summary) => (
              <div className="info-row" key={summary.retailerName}>
                <span>{summary.retailerName}</span>
                <strong>{formatEuro(summary.total)}</strong>
              </div>
            ))}
          </div>
        ) : null}
        <div className="export-actions">
          <button type="button" className="cta" onClick={exportToReminders} disabled={items.length === 0}>
            In Erinnerungen exportieren
          </button>
          <button type="button" className="ghost-button" onClick={exportToNotes} disabled={items.length === 0}>
            In Notizen exportieren
          </button>
          <button type="button" className="ghost-button" onClick={copyPlainTextExport} disabled={items.length === 0}>
            Text kopieren
          </button>
          <button type="button" className="ghost-button" onClick={downloadTextExport} disabled={items.length === 0}>
            TXT exportieren
          </button>
          <button type="button" className="ghost-button" onClick={downloadCsvExport} disabled={items.length === 0}>
            CSV exportieren
          </button>
        </div>
        {exportStatus ? <div className="muted export-status">{exportStatus}</div> : null}
      </aside>
    </div>
  );
}
