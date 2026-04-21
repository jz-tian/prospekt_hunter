"use client";

import { useEffect, useMemo, useState } from "react";
import { formatEuro } from "@/lib/format";
import { RETAILERS } from "@/lib/constants";

async function fetchList() {
  const response = await fetch("/api/shopping-list", { cache: "no-store" });
  if (!response.ok) return { items: [] };
  return response.json();
}

function buildGroupedSummaries(items) {
  const grouped = items.reduce((acc, item) => {
    acc[item.retailerName] ??= [];
    acc[item.retailerName].push(item);
    return acc;
  }, {});

  return Object.entries(grouped).map(([retailerName, retailerItems]) => ({
    retailerName,
    retailerSlug: retailerItems[0]?.retailerSlug,
    retailerColor: retailerItems[0]?.retailerColor,
    items: retailerItems,
    quantity: retailerItems.reduce((sum, item) => sum + item.quantity, 0),
    total: retailerItems.reduce((sum, item) => sum + item.salePrice * item.quantity, 0)
  }));
}

function buildPlainText(summaries, total) {
  const lines = ["Einkaufsliste", ""];
  for (const s of summaries) {
    lines.push(`${s.retailerName} · ${formatEuro(s.total)}`);
    for (const item of s.items) {
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
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function EmptyBasket({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke="#8B7355" strokeWidth="1.5" aria-hidden="true">
      <path d="M10 35 L90 35 L82 85 L18 85 Z"/>
      <path d="M10 35 L25 15 L40 35 M90 35 L75 15 L60 35"/>
      <path d="M22 50 L78 50 M22 65 L78 65" strokeDasharray="2 3"/>
      <path d="M30 35 V85 M50 35 V85 M70 35 V85" strokeDasharray="2 3"/>
    </svg>
  );
}

export function ShoppingListDrawer() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [exportStatus, setExportStatus] = useState("");
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator.share === "function");
  }, []);

  async function refresh() {
    const payload = await fetchList();
    setItems(payload.items);
  }

  useEffect(() => {
    refresh();
    function handleUpdate() { refresh(); }
    function handleToggle() { setOpen((v) => !v); }
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

  function flash(msg, ms = 2000) {
    setExportStatus(msg);
    setTimeout(() => setExportStatus(""), ms);
  }

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

  async function copyText() {
    try {
      await navigator.clipboard.writeText(buildPlainText(summaries, total));
      flash("Kopiert ✓");
    } catch {
      flash("Fehler");
    }
  }

  async function shareText() {
    try {
      await navigator.share({ title: "Einkaufsliste", text: buildPlainText(summaries, total) });
    } catch {
      // user cancelled — silently ignore
    }
  }

  function downloadTxt() {
    downloadFile("einkaufsliste.txt", buildPlainText(summaries, total), "text/plain;charset=utf-8");
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
    <>
      <div className={`drawer-backdrop${open ? " on" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`drawer${open ? " on" : ""}`} aria-hidden={!open} aria-label="Einkaufsliste">
        <div className="drawer-head">
          <div className="t">
            <span className="sub">買 物 籠</span>
            Einkaufsliste
          </div>
          <button className="close" onClick={() => setOpen(false)} aria-label="Schließen">✕</button>
        </div>

        <div className="drawer-body">
          {items.length === 0 ? (
            <div className="empty-drawer">
              <EmptyBasket size={80} />
              <p>Ihr Korb ist leer.<br />Stöbern Sie durch den Markt und sammeln Sie Ihre Funde.</p>
            </div>
          ) : summaries.map((g) => {
            const retailer = RETAILERS.find((r) => r.slug === g.retailerSlug);
            const colorClass = retailer?.colorClass ?? "";
            return (
              <div key={g.retailerName}>
                <div className={`group-head ${colorClass}`}>
                  <span>{g.retailerName}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, fontWeight: 400 }}>
                      {g.items.length} Pos.
                    </span>
                    <button
                      className="clear-btn"
                      onClick={() => clearItems(g.retailerSlug)}
                      disabled={busy}
                    >
                      Leeren
                    </button>
                  </div>
                </div>
                {g.items.map((item) => (
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
                      <small>{item.unitInfo || ""}</small>
                    </span>
                    <div className="qty-ctrl">
                      <button className="qty-btn" onClick={() => mutateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })} disabled={busy} aria-label="Weniger">−</button>
                      <span className="qty-val">{item.quantity}</span>
                      <button className="qty-btn" onClick={() => mutateItem(item.id, { quantity: item.quantity + 1 })} disabled={busy} aria-label="Mehr">+</button>
                    </div>
                    <span className="price">{formatEuro(item.salePrice * item.quantity)}</span>
                    <button className="rm" onClick={() => removeItem(item.id)} disabled={busy} aria-label="Entfernen">✕</button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {items.length > 0 && (
          <div className="drawer-foot">
            <div className="total-row">
              <span className="label">TOTAL 合計</span>
              <span className="sum">{formatEuro(total)}</span>
            </div>
            <div className="export-row">
              {canShare ? (
                <button className="stamp-btn" onClick={shareText}>
                  <span className="jp">共有</span>Teilen
                </button>
              ) : (
                <button className="stamp-btn" onClick={copyText}>
                  <span className="jp">複写</span>Kopieren
                </button>
              )}
              <button className="stamp-btn" onClick={downloadTxt}>
                <span className="jp">出力</span>TXT
              </button>
              <button className="stamp-btn" onClick={downloadCsv}>
                <span className="jp">出力</span>CSV
              </button>
              <button className="stamp-btn" onClick={() => clearItems()} disabled={busy} style={{ color: "var(--red)" }}>
                <span className="jp">削除</span>Leeren
              </button>
            </div>
            {exportStatus && (
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "var(--sage)", marginTop: 8, letterSpacing: "0.1em" }}>
                {exportStatus}
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
