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
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    async function refresh() {
      const next = await fetchList();
      setItems(next.items);
    }

    refresh();

    function handleUpdate() { refresh(); }
    window.addEventListener("shopping-list-updated", handleUpdate);
    return () => window.removeEventListener("shopping-list-updated", handleUpdate);
  }, []);

  async function mutateItem(id, payload) {
    await fetch(`/api/shopping-list/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const next = await fetchList();
    setItems(next.items);
    window.dispatchEvent(new CustomEvent("shopping-list-updated"));
  }

  async function removeItem(id) {
    await fetch(`/api/shopping-list/${id}`, { method: "DELETE" });
    const next = await fetchList();
    setItems(next.items);
    window.dispatchEvent(new CustomEvent("shopping-list-updated"));
  }

  const total = items.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);
  const retailerSummaries = buildGroupedSummaries(items);
  const retailerCount = retailerSummaries.length;

  function flash(msg) {
    setExportStatus(msg);
    setTimeout(() => setExportStatus(""), 2000);
  }

  function buildPlainText() {
    const lines = ["Einkaufsliste", ""];
    for (const summary of retailerSummaries) {
      lines.push(`${summary.retailerName} · ${formatEuro(summary.total)}`);
      for (const item of summary.items) {
        let line = `${item.checked ? "☑" : "☐"} ${item.quantity}x ${item.productName} (${formatEuro(item.salePrice)})`;
        if (item.note) line += ` — ${item.note}`;
        lines.push(line);
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

  async function copyText() {
    try {
      await navigator.clipboard.writeText(buildPlainText());
      flash("Textliste kopiert");
    } catch {
      flash("Kopieren fehlgeschlagen");
    }
  }

  async function shareText() {
    try {
      await navigator.share({ title: "Einkaufsliste", text: buildPlainText() });
    } catch {
      // user cancelled — silently ignore
    }
  }

  function downloadTxt() {
    downloadFile("einkaufsliste.txt", buildPlainText(), "text/plain;charset=utf-8");
    flash("Textdatei exportiert");
  }

  function downloadCsv() {
    const rows = [
      ["Retailer", "Produkt", "Menge", "Einzelpreis", "Gesamt", "Notiz", "Erledigt"],
      ...items.map((item) => [
        item.retailerName,
        item.productName,
        String(item.quantity),
        item.salePrice.toFixed(2),
        (item.salePrice * item.quantity).toFixed(2),
        item.note ?? "",
        item.checked ? "ja" : "nein"
      ])
    ];
    // UTF-8 BOM so Excel on Windows opens German characters correctly
    const bom = "\uFEFF";
    const content = bom + rows.map((row) => row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\n");
    downloadFile("einkaufsliste.csv", content, "text/csv;charset=utf-8");
    flash("CSV exportiert");
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
                      <button className="icon-button" type="button" onClick={() => mutateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}>-</button>
                      <span>{item.quantity}</span>
                      <button className="icon-button" type="button" onClick={() => mutateItem(item.id, { quantity: item.quantity + 1 })}>+</button>
                    </div>
                    <button className="ghost-button" type="button" onClick={() => removeItem(item.id)}>Entfernen</button>
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
        {retailerSummaries.length > 0 && (
          <div className="retailer-summary-list">
            {retailerSummaries.map((summary) => (
              <div className="info-row" key={summary.retailerName}>
                <span>{summary.retailerName}</span>
                <strong>{formatEuro(summary.total)}</strong>
              </div>
            ))}
          </div>
        )}
        <div className="export-actions">
          {canShare ? (
            <button type="button" className="cta" onClick={shareText} disabled={items.length === 0}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
              Teilen
            </button>
          ) : (
            <button type="button" className="cta" onClick={copyText} disabled={items.length === 0}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Text kopieren
            </button>
          )}
          <button type="button" className="ghost-button" onClick={downloadTxt} disabled={items.length === 0}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
            </svg>
            TXT exportieren
          </button>
          <button type="button" className="ghost-button" onClick={downloadCsv} disabled={items.length === 0}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="8" y2="17"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="16" y1="13" x2="16" y2="17"/>
            </svg>
            CSV exportieren
          </button>
        </div>
        {exportStatus && <div className="muted export-status">{exportStatus}</div>}
      </aside>
    </div>
  );
}
