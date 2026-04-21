"use client";

import { useEffect, useState } from "react";
import { formatEuro } from "@/lib/format";
import { RETAILERS } from "@/lib/constants";

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
    retailerSlug: retailerItems[0]?.retailerSlug,
    items: retailerItems,
    quantity: retailerItems.reduce((sum, item) => sum + item.quantity, 0),
    total: retailerItems.reduce((sum, item) => sum + item.salePrice * item.quantity, 0)
  }));
}

function buildPlainText(summaries, total) {
  const lines = ["Einkaufsliste", ""];
  for (const summary of summaries) {
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

function EmptyBasket({ size = 84 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke="#8B7355" strokeWidth="1.5" aria-hidden="true">
      <path d="M10 35 L90 35 L82 85 L18 85 Z"/>
      <path d="M10 35 L25 15 L40 35 M90 35 L75 15 L60 35"/>
      <path d="M22 50 L78 50 M22 65 L78 65" strokeDasharray="2 3"/>
      <path d="M30 35 V85 M50 35 V85 M70 35 V85" strokeDasharray="2 3"/>
    </svg>
  );
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
  const wasTotal = items.reduce((sum, item) => sum + (item.originalPrice ?? item.salePrice) * item.quantity, 0);
  const saved = wasTotal - total;
  const retailerSummaries = buildGroupedSummaries(items);

  function flash(msg) {
    setExportStatus(msg);
    setTimeout(() => setExportStatus(""), 2000);
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(buildPlainText(retailerSummaries, total));
      flash("Kopiert ✓");
    } catch {
      flash("Fehler");
    }
  }

  async function shareText() {
    try {
      await navigator.share({ title: "Einkaufsliste", text: buildPlainText(retailerSummaries, total) });
    } catch {
      // user cancelled — silently ignore
    }
  }

  function downloadTxt() {
    downloadFile("einkaufsliste.txt", buildPlainText(retailerSummaries, total), "text/plain;charset=utf-8");
    flash("TXT gespeichert");
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
    const bom = "﻿";
    const content = bom + rows.map((row) => row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\n");
    downloadFile("einkaufsliste.csv", content, "text/csv;charset=utf-8");
    flash("CSV gespeichert");
  }

  return (
    <div className="shop-layout">
      <div className="ledger">
        <div className="ledger-head">
          <span>買物帳 · LEDGER</span>
          <span className="mono" style={{ fontSize: 11, letterSpacing: "0.15em" }}>
            {items.length} Pos.
          </span>
        </div>
        <div className="ledger-body">
          {items.length === 0 ? (
            <div className="empty-drawer">
              <EmptyBasket size={84} />
              <p>Der Korb ist noch leer.<br />Stöbern Sie durch die Angebote und sammeln Sie Ihre Schätze.</p>
            </div>
          ) : retailerSummaries.map((summary) => {
            const retailer = RETAILERS.find((r) => r.slug === summary.retailerSlug);
            const colorClass = retailer?.colorClass ?? "";
            return (
              <div key={summary.retailerName}>
                <div className={`group-head ${colorClass}`}>
                  <span>{summary.retailerName} · {retailer?.jp ?? ""}</span>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, fontWeight: 400 }}>
                    {summary.items.length} Pos.
                  </span>
                </div>
                {summary.items.map((item) => (
                  <div key={item.id} className="list-row">
                    <span
                      className={`check${item.checked ? " on" : ""}`}
                      onClick={() => mutateItem(item.id, { checked: item.checked ? 0 : 1 })}
                      role="checkbox"
                      aria-checked={Boolean(item.checked)}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === " " && mutateItem(item.id, { checked: item.checked ? 0 : 1 })}
                    />
                    <span className={`name${item.checked ? " done" : ""}`}>
                      {item.productName}
                      <small>gültig {item.validTo ? new Date(item.validTo).toLocaleDateString("de-DE") : "—"}</small>
                    </span>
                    <div className="qty-ctrl">
                      <button className="qty-btn" onClick={() => mutateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })} aria-label="Weniger">−</button>
                      <span className="qty-val">{item.quantity}</span>
                      <button className="qty-btn" onClick={() => mutateItem(item.id, { quantity: item.quantity + 1 })} aria-label="Mehr">+</button>
                    </div>
                    <span className="price">{formatEuro(item.salePrice * item.quantity)}</span>
                    <button className="rm" onClick={() => removeItem(item.id)} aria-label="Entfernen">✕</button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <aside className="summary-panel">
        <h3>勘定 · Zusammenfassung</h3>
        <div className="summary-row"><span>Positionen</span><span className="v">{items.length}</span></div>
        <div className="summary-row"><span>Stückzahl</span><span className="v">{items.reduce((s, i) => s + i.quantity, 0)}</span></div>
        <div className="summary-row"><span>Märkte</span><span className="v">{retailerSummaries.length}</span></div>
        <div className="total-row" style={{ marginTop: 12 }}>
          <span className="label">TOTAL 合計</span>
          <span className="sum">{formatEuro(total)}</span>
        </div>

        {saved > 0 && (
          <div className="savings-hanko">
            <div>
              <div className="w">{formatEuro(saved)}</div>
              <div className="l">GESPART 節約</div>
            </div>
          </div>
        )}

        <div className="export-row" style={{ marginTop: 18 }}>
          {canShare ? (
            <button className="stamp-btn" onClick={shareText} disabled={items.length === 0}>
              <span className="jp">共有</span>Teilen
            </button>
          ) : (
            <button className="stamp-btn" onClick={copyText} disabled={items.length === 0}>
              <span className="jp">複写</span>Kopieren
            </button>
          )}
          <button className="stamp-btn" onClick={downloadTxt} disabled={items.length === 0}>
            <span className="jp">出力</span>TXT
          </button>
          <button className="stamp-btn" onClick={downloadCsv} disabled={items.length === 0}>
            <span className="jp">出力</span>CSV
          </button>
        </div>
        {exportStatus && (
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "var(--sage)", marginTop: 8, letterSpacing: "0.1em" }}>
            {exportStatus}
          </div>
        )}
      </aside>
    </div>
  );
}
