"use client";

import { useEffect, useMemo, useState } from "react";
import { formatEuro } from "@/lib/format";

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
      flash("Kopiert");
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
    // UTF-8 BOM so Excel on Windows opens German characters correctly
    const bom = "\uFEFF";
    const content = bom + rows.map((row) => row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\n");
    downloadFile("einkaufsliste.csv", content, "text/csv;charset=utf-8");
    flash("CSV gespeichert");
  }

  return (
    <aside
      id="shopping-list-drawer"
      className={`shopping-drawer ${open ? "open" : ""}`}
      aria-hidden={!open}
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div className="shopping-drawer-panel">
        <div className="shopping-drawer-header">
          <div className="shopping-drawer-title">
            <span className="shopping-drawer-count-badge">{count}</span>
            <h3>Einkaufsliste</h3>
          </div>
          <button type="button" className="drawer-close-btn" onClick={() => setOpen(false)} aria-label="Schließen">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="shopping-drawer-body">
          {items.length === 0 ? (
            <div className="drawer-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" aria-hidden="true">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <p>Noch nichts drin</p>
            </div>
          ) : (
            summaries.map((summary) => (
              <section className="shopping-drawer-group" key={summary.retailerName} style={{ "--retailer-color": summary.retailerColor }}>
                <div className="shopping-drawer-group-header">
                  <div className="shopping-drawer-group-meta">
                    <img src={`/logos/${summary.retailerSlug}.svg`} alt={summary.retailerName} className="drawer-retailer-logo" />
                    <span className="muted">{formatEuro(summary.total)}</span>
                  </div>
                  <button type="button" className="drawer-text-btn" onClick={() => clearItems(summary.retailerSlug)} disabled={busy}>
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
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="drawer-item-img" aria-hidden="true" />
                    ) : (
                      <div className="drawer-item-img-placeholder" style={{ "--retailer-color": summary.retailerColor }} />
                    )}
                    <div className="shopping-drawer-copy">
                      <div className="shopping-name">{item.productName}</div>
                      <div className="shopping-price">{formatEuro(item.salePrice)} · {item.quantity}×</div>
                    </div>
                    <div className="shopping-drawer-item-actions">
                      <button className="drawer-qty-btn" type="button" onClick={() => mutateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })} disabled={busy} aria-label="Menge verringern">−</button>
                      <button className="drawer-qty-btn" type="button" onClick={() => mutateItem(item.id, { quantity: item.quantity + 1 })} disabled={busy} aria-label="Menge erhöhen">+</button>
                      <button className="drawer-remove-btn" type="button" onClick={() => removeItem(item.id)} disabled={busy} aria-label="Entfernen">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
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

        {items.length > 0 && (
          <div className="shopping-drawer-footer">
            <div className="shopping-drawer-total">
              <span>Gesamt</span>
              <strong>{formatEuro(total)}</strong>
            </div>
            <div className="drawer-export-panel">
              <div className="drawer-export-label">Exportieren</div>
              <div className="drawer-export-actions">
                {canShare ? (
                  <button type="button" className="drawer-export-btn" onClick={shareText}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
                    </svg>
                    Teilen
                  </button>
                ) : (
                  <button type="button" className="drawer-export-btn" onClick={copyText}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    Kopieren
                  </button>
                )}
                <button type="button" className="drawer-export-btn" onClick={downloadTxt}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
                  </svg>
                  TXT
                </button>
                <button type="button" className="drawer-export-btn" onClick={downloadCsv}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="8" y2="17"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="16" y1="13" x2="16" y2="17"/>
                  </svg>
                  CSV
                </button>
              </div>
              {exportStatus && <div className="drawer-export-status">{exportStatus}</div>}
            </div>
            <button type="button" className="ghost-button" style={{ width: "100%" }} onClick={() => clearItems()} disabled={busy}>
              Alles leeren
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
