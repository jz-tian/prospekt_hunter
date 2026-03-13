# RabattHunter UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the app to RabattHunter and replace the warm-cream glassmorphism UI with a clean, modern deep-green/white design matching the FreshyMart reference aesthetic.

**Architecture:** Pure CSS rewrite in `globals.css` + targeted JSX changes in 7 files. Two new small client components (`NavLinks`, `CartHeaderButton`) extracted from `site-shell.js`. No data logic, API routes, or `lib/` touched.

**Tech Stack:** Next.js 15 App Router, pure CSS (no Tailwind), `next/font/google` for Inter, inline SVG icons (no icon library).

**Spec:** `docs/superpowers/specs/2026-03-13-rabatthunter-ui-redesign-design.md`

**Dev server:** `npm run dev` → http://localhost:3000

---

## Chunk 1: Foundation — Font + Design Tokens

### Task 1: Add Inter font and update metadata

**Files:**
- Modify: `app/layout.js`

- [ ] **Step 1: Update layout.js**

Replace the entire file content:

```js
import { Inter } from "next/font/google";
import "./globals.css";

// Use `variable` (not `className`) so the font is exposed as a CSS custom property
// --font-inter, which globals.css references via var(--font-inter).
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "RabattHunter",
  description: "Wöchentliche Prospekt-Angebote von ALDI, Lidl, Denns BioMarkt, NORMA und EDEKA — kategorisiert, gefiltert, auf einen Blick."
};

export default function RootLayout({ children }) {
  return (
    <html lang="de" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Verify dev server starts without error**

Run: `npm run dev`
Expected: Server starts, no font-related errors in terminal.

- [ ] **Step 3: Commit**

```bash
git add app/layout.js
git commit -m "feat: add Inter font and rename to RabattHunter"
```

---

### Task 2: Rewrite globals.css — design tokens, reset, shell, typography

**Files:**
- Modify: `app/globals.css` (full rewrite — keep building through Tasks 2–6)

> Note: We build globals.css incrementally across Tasks 2–6. Each task appends a section. Start with a full replacement in Task 2, then append in subsequent tasks.

- [ ] **Step 1: Replace globals.css with tokens + reset + shell + typography base**

Replace the entire file with:

```css
/* ── Design Tokens ─────────────────────────────────────────── */
:root {
  --green:        #1a5c35;
  --green-mid:    #2d7a4f;
  --green-light:  #e8f2ec;
  --red:          #d42b2b;
  --text:         #1a1a1a;
  --muted:        #6b7280;
  --bg:           #f5f6f5;
  --surface:      #ffffff;
  --border:       #e5e7e5;
  --shadow:       0 4px 16px rgba(0, 0, 0, 0.07);
  --shadow-hover: 0 8px 24px rgba(0, 0, 0, 0.12);
  --radius-card:  16px;
  --radius-btn:   12px;
  --max-width:    1360px;
  --font-body:    var(--font-inter), "Inter", system-ui, sans-serif;
}

/* ── Reset ──────────────────────────────────────────────────── */
*, *::before, *::after {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--text);
  background: var(--bg);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

a {
  color: inherit;
  text-decoration: none;
}

button, input, select, textarea {
  font: inherit;
}

/* ── Shell (page content wrapper) ──────────────────────────── */
.shell {
  width: min(calc(100% - 48px), var(--max-width));
  margin: 0 auto;
  padding: 28px 0 64px;
}

/* ── Sections ───────────────────────────────────────────────── */
.section {
  margin-top: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-end;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.section-header p {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 0.82rem;
}

/* ── Utility ────────────────────────────────────────────────── */
.muted, .meta {
  color: var(--muted);
}

.footer-note {
  margin-top: 32px;
  color: var(--muted);
  font-size: 0.82rem;
}
```

- [ ] **Step 2: Check browser — body background and font should already be updated**

Open http://localhost:3000. Page should show flat `#f5f6f5` background with Inter font. Layout will look broken until remaining CSS is added — that's expected.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: globals.css design tokens, reset, shell, typography base"
```

---

## Chunk 2: Header

### Task 3: Rewrite site-shell.js with two-layer header structure

**Files:**
- Modify: `components/site-shell.js`
- Create: `components/nav-links.js`
- Create: `components/cart-header-button.js`

- [ ] **Step 1: Create components/nav-links.js**

```js
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingListNavLink } from "@/components/shopping-list-nav-link";

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="site-nav">
      <Link href="/" className={`nav-link${pathname === "/" ? " active" : ""}`}>
        Start
      </Link>
      <Link href="/offers" className={`nav-link${pathname.startsWith("/offers") ? " active" : ""}`}>
        Angebote
      </Link>
      <Link href="/prospekte" className={`nav-link${pathname.startsWith("/prospekte") ? " active" : ""}`}>
        Prospekte
      </Link>
      <ShoppingListNavLink />
    </nav>
  );
}
```

- [ ] **Step 2: Create components/cart-header-button.js**

```js
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
```

- [ ] **Step 3: Rewrite components/site-shell.js**

```js
import { NavLinks } from "@/components/nav-links";
import { CartHeaderButton } from "@/components/cart-header-button";
import { ShoppingListDrawer } from "@/components/shopping-list-drawer";

export function SiteShell({ children }) {
  return (
    <>
      <header className="site-header">
        <div className="header-top">
          <div className="header-inner">
            <div className="brand">
              <span className="brand-rh">RH·</span>
              <span className="brand-name">RabattHunter</span>
            </div>

            <div className="header-search">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="search"
                className="search-input"
                placeholder="Produkte suchen…"
                disabled
                aria-label="Produktsuche (demnächst verfügbar)"
              />
            </div>

            <CartHeaderButton />
          </div>
        </div>

        <div className="header-nav">
          <div className="header-inner">
            <NavLinks />
          </div>
        </div>
      </header>

      <div className="shell">
        {children}
      </div>

      <ShoppingListDrawer />
    </>
  );
}
```

- [ ] **Step 4: Add header CSS to globals.css (append)**

Append to `app/globals.css`:

```css
/* ── Header ─────────────────────────────────────────────────── */
.site-header {
  background: var(--green);
  width: 100%;
}

.header-inner {
  width: min(calc(100% - 48px), var(--max-width));
  margin: 0 auto;
}

.header-top .header-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
}

/* Brand */
.brand {
  display: flex;
  align-items: baseline;
  gap: 2px;
  white-space: nowrap;
  flex-shrink: 0;
}

.brand-rh {
  color: #ffffff;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.brand-name {
  color: rgba(255, 255, 255, 0.72);
  font-size: 1.05rem;
  font-weight: 400;
}

/* Search */
.header-search {
  flex: 1;
  max-width: 480px;
  position: relative;
  margin: 0 auto;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 9px 16px 9px 40px;
  border: none;
  border-radius: 999px;
  background: #ffffff;
  color: var(--text);
  font-size: 0.875rem;
  cursor: not-allowed;
  opacity: 0.9;
}

.search-input:disabled {
  cursor: not-allowed;
}

.search-input::placeholder {
  color: var(--muted);
}

/* Cart header button */
.cart-header-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 160ms;
}

.cart-header-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.cart-header-count {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--red);
  color: #ffffff;
  font-size: 0.7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Nav bar */
.header-nav {
  background: #ffffff;
  border-bottom: 1px solid var(--border);
}

.header-nav .header-inner {
  padding: 0;
}

.site-nav {
  display: flex;
  gap: 4px;
}

.nav-link {
  padding: 12px 16px;
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--text);
  border-bottom: 2px solid transparent;
  transition: color 160ms, border-color 160ms;
  white-space: nowrap;
}

.nav-link:hover {
  color: var(--green);
}

.nav-link.active {
  color: var(--green);
  font-weight: 600;
  border-bottom-color: var(--green);
}

.nav-link-count {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.nav-count {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--green-light);
  color: var(--green);
  font-size: 0.72rem;
  font-weight: 700;
}

/* ── Mobile header ──────────────────────────────────────────── */
@media (max-width: 768px) {
  .header-search {
    display: none;
  }

  .site-nav {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .site-nav::-webkit-scrollbar {
    display: none;
  }
}
```

- [ ] **Step 5: Verify header in browser**

Open http://localhost:3000. Expect:
- Full-width deep green top bar with "RH·RabattHunter" left, search bar center, cart icon right
- White nav bar below with Start / Angebote / Prospekte / Einkaufsliste links
- Active link on Start page highlighted green with underline
- All 4 nav links (including Einkaufsliste) show green hover and active underline — `ShoppingListNavLink` already uses `className="nav-link nav-link-count"` so it is compatible with the new CSS.

> Note: At this point the old floating "Einkaufsliste" text button inside `ShoppingListDrawer` still exists alongside the new header cart icon. Both will open the drawer. This is intentional and temporary — the floating button is removed in Task 4.

- [ ] **Step 6: Commit**

```bash
git add components/site-shell.js components/nav-links.js components/cart-header-button.js app/globals.css
git commit -m "feat: two-layer header with brand wordmark, search placeholder, cart icon"
```

---

## Chunk 3: Cards, Buttons, Drawer

### Task 4: Update ShoppingListDrawer — remove floating trigger, add event listener, SVG icons

**Files:**
- Modify: `components/shopping-list-drawer.js`

- [ ] **Step 1: Update useEffect to listen for toggle-shopping-drawer event**

In the `useEffect` block (around line 43), add the toggle listener alongside the existing one:

```js
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
```

- [ ] **Step 2: Remove the floating trigger button, update close button and panel**

Replace the entire return statement with:

```jsx
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
```

- [ ] **Step 3: Fix search input class in components/offers-filter.js**

Change `className="search-input"` to `className="search-input-field"` on the filter `<input>` (line 7 of `offers-filter.js`). The `.search-input` class is now reserved for the disabled header search bar.

```js
<input
  className="search-input-field"
  type="search"
  name="search"
  placeholder="Produkte oder Marken suchen"
  defaultValue={searchParams.search ?? ""}
/>
```

- [ ] **Step 4: Verify drawer toggles via header cart button**

Click the cart icon in the header. Drawer should slide in from the right. Click again or X to close. Confirm the old floating "Einkaufsliste" text button is gone.

- [ ] **Step 5: Commit**

```bash
git add components/shopping-list-drawer.js components/offers-filter.js
git commit -m "feat: drawer triggered by header cart button via CustomEvent, SVG icons"
```

---

### Task 5: Rewrite offer-card.js

**Files:**
- Modify: `components/offer-card.js`

- [ ] **Step 1: Rewrite offer-card.js**

```js
import { AddToListButton } from "@/components/add-to-list-button";
import { formatDateRange, formatEuro } from "@/lib/format";

export function OfferCard({ offer }) {
  const displayPrice = offer.priceLabel || formatEuro(offer.salePrice);
  const canAddToList = !(offer.offerKind === "coupon" && offer.priceLabel);

  const discountPercent =
    offer.originalPrice && offer.salePrice
      ? Math.round((1 - offer.salePrice / offer.originalPrice) * 100)
      : null;

  return (
    <article className="card offer-card">
      <div className="offer-image-wrap">
        {offer.imageUrl ? (
          <img className="offer-image" src={offer.imageUrl} alt={offer.productName} loading="lazy" />
        ) : (
          <div className="offer-image-placeholder" aria-hidden="true" />
        )}
        {discountPercent !== null && (
          <span className="discount-badge">−{discountPercent}%</span>
        )}
      </div>

      <div className="offer-body">
        <span className="retailer-pill">{offer.retailerName}</span>
        <h4 className="offer-title">{offer.productName}</h4>
        <p className="offer-meta">{offer.brand ? `${offer.brand} · ` : ""}{offer.unitInfo || "Aktionsartikel"}</p>

        <div className="price-row">
          <span className="sale-price">{displayPrice}</span>
          {offer.originalPrice ? (
            <span className="original-price">{formatEuro(offer.originalPrice)}</span>
          ) : null}
        </div>

        <div className="offer-footer">
          <span className="muted offer-date">Gültig {formatDateRange(offer.validFrom, offer.validTo)}</span>
          {canAddToList ? <AddToListButton offerId={offer.id} /> : null}
        </div>
      </div>
    </article>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/offer-card.js
git commit -m "feat: offer-card with discount badge, image blend-mode, tighter layout"
```

---

### Task 6: Rewrite add-to-list-button.js as icon-only round button

**Files:**
- Modify: `components/add-to-list-button.js`

- [ ] **Step 1: Rewrite add-to-list-button.js**

```js
"use client";

import { useState, useTransition } from "react";

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
);

const IconSpinner = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true" style={{ animation: "spin 600ms linear infinite" }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

export function AddToListButton({ offerId }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

  function handleClick() {
    if (done) return;
    startTransition(async () => {
      const response = await fetch("/api/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId, quantity: 1 })
      });

      if (response.ok) {
        setDone(true);
        window.dispatchEvent(new CustomEvent("shopping-list-updated"));
      } else {
        setError(true);
      }
    });
  }

  const label = done
    ? "Bereits in der Einkaufsliste"
    : error
    ? "Fehler beim Hinzufügen"
    : "Zur Einkaufsliste hinzufügen";

  return (
    <button
      type="button"
      className={`add-to-list-btn${done ? " done" : ""}${error ? " error" : ""}`}
      onClick={handleClick}
      disabled={pending || done}
      aria-label={label}
      title={label}
    >
      {pending ? <IconSpinner /> : done ? <IconCheck /> : <IconPlus />}
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/add-to-list-button.js
git commit -m "feat: add-to-list icon-only round button with SVG states"
```

---

### Task 7: Add card + button + drawer CSS to globals.css

**Files:**
- Modify: `app/globals.css` (append)

- [ ] **Step 1: Append card, button, and drawer styles**

Append to `app/globals.css`:

```css
/* ── Cards ──────────────────────────────────────────────────── */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow);
}

/* ── Offer Card ─────────────────────────────────────────────── */
.offer-card {
  overflow: hidden;
  transition: transform 160ms ease, box-shadow 160ms ease;
}

.offer-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-hover);
}

.offer-image-wrap {
  position: relative;
  height: 160px;
  background: #f5f7f5;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.offer-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  mix-blend-mode: multiply;
}

.offer-image-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #eef1ee, #e4e8e4);
}

.discount-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: var(--red);
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 999px;
}

.offer-body {
  padding: 14px 16px 16px;
}

.retailer-pill {
  display: inline-block;
  background: var(--green-light);
  color: var(--green);
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.offer-title {
  margin: 8px 0 4px;
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.offer-meta {
  margin: 0;
  font-size: 0.78rem;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 10px 0;
}

.sale-price {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--red);
  line-height: 1;
}

.original-price {
  font-size: 0.82rem;
  color: var(--muted);
  text-decoration: line-through;
}

.offer-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.offer-date {
  font-size: 0.75rem;
}

/* ── Add to list button ─────────────────────────────────────── */
.add-to-list-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: var(--green);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 160ms, transform 160ms;
}

.add-to-list-btn:hover:not(:disabled) {
  background: var(--green-mid);
  transform: scale(1.08);
}

.add-to-list-btn.done {
  background: var(--green-light);
  color: var(--green);
  cursor: default;
}

.add-to-list-btn.error {
  background: #fdecea;
  color: var(--red);
  cursor: default;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Grids ──────────────────────────────────────────────────── */
.offers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.retailer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.prospekt-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

/* ── Retailer card ──────────────────────────────────────────── */
.retailer-card {
  padding: 18px 20px;
  overflow: hidden;
  transition: transform 160ms ease, box-shadow 160ms ease;
}

.retailer-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-hover);
}

.retailer-accent {
  width: 100%;
  height: 4px;
  border-radius: 999px;
  margin-bottom: 14px;
}

.retailer-card h4 {
  margin: 10px 0 6px;
  font-size: 0.95rem;
  font-weight: 600;
}

/* ── Prospekt card ──────────────────────────────────────────── */
.prospekt-card {
  padding: 20px;
  transition: transform 160ms ease, box-shadow 160ms ease;
}

.prospekt-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-hover);
}

.prospekt-card h4 {
  margin: 10px 0 6px;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
}

/* ── General buttons ────────────────────────────────────────── */
.cta {
  display: inline-flex;
  align-items: center;
  border: none;
  border-radius: var(--radius-btn);
  padding: 11px 18px;
  background: #ffffff;
  color: var(--green);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 160ms, transform 160ms;
}

.cta:hover {
  background: var(--green-light);
  transform: translateY(-1px);
}

.ghost-button {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: var(--radius-btn);
  padding: 10px 16px;
  background: var(--surface);
  color: var(--text);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 160ms, transform 160ms;
}

.ghost-button:hover {
  border-color: var(--green);
  color: var(--green);
  transform: translateY(-1px);
}

.ghost-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.compact-button {
  padding: 6px 12px;
  font-size: 0.8rem;
}

.icon-button {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  transition: border-color 160ms;
}

.icon-button:hover {
  border-color: var(--green);
  color: var(--green);
}

/* ── Shopping Drawer ────────────────────────────────────────── */
.shopping-drawer {
  position: fixed;
  inset: 0;
  z-index: 55;
  pointer-events: none;
}

.shopping-drawer.open {
  pointer-events: auto;
  background: rgba(26, 26, 26, 0.28);
}

.shopping-drawer-panel {
  position: absolute;
  top: 16px;
  right: 16px;
  bottom: 16px;
  width: min(400px, calc(100vw - 32px));
  display: grid;
  grid-template-rows: auto auto auto minmax(0, 1fr);
  gap: 12px;
  padding: 20px;
  background: var(--surface);
  border-radius: 20px;
  border: 1px solid var(--border);
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.14);
  transform: translateX(calc(100% + 24px));
  transition: transform 200ms ease;
}

.shopping-drawer.open .shopping-drawer-panel {
  transform: translateX(0);
}

.shopping-drawer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.drawer-eyebrow {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--green);
}

.shopping-drawer-summary {
  padding: 12px 14px;
  display: grid;
  gap: 6px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.875rem;
}

.shopping-drawer-actions {
  display: flex;
  gap: 8px;
}

.shopping-drawer-body {
  display: grid;
  gap: 10px;
  overflow-y: auto;
  padding-right: 2px;
}

.shopping-drawer-group {
  padding: 12px 14px;
}

.shopping-drawer-group-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.shopping-drawer-item {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 8px 0;
  border-top: 1px solid var(--border);
}

.shopping-drawer-item:first-of-type {
  border-top: none;
}

.shopping-drawer-item.done .shopping-name {
  text-decoration: line-through;
  opacity: 0.6;
}

.shopping-drawer-copy {
  min-width: 0;
}

.shopping-drawer-item-actions {
  display: flex;
  gap: 4px;
}

/* ── Toolbar ────────────────────────────────────────────────── */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

/* ── Filters ────────────────────────────────────────────────── */
.filters {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  padding: 14px 16px;
  margin-bottom: 20px;
}

.filters form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.search-input-field {
  flex: 1 1 240px;
  padding: 9px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-btn);
  background: var(--surface);
  font-size: 0.875rem;
  color: var(--text);
}

.search-input-field:focus {
  outline: none;
  border-color: var(--green);
}

.filter-select {
  padding: 9px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-btn);
  background: var(--surface);
  font-size: 0.875rem;
  color: var(--text);
  cursor: pointer;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 160ms, color 160ms;
}

.chip:hover,
.chip[aria-current="page"] {
  border-color: var(--green);
  color: var(--green);
  background: var(--green-light);
}

/* ── Empty state ────────────────────────────────────────────── */
.empty-state {
  padding: 32px;
  text-align: center;
  color: var(--muted);
}

.empty-state h3,
.empty-state h4 {
  margin: 0 0 8px;
  font-weight: 600;
}
```

- [ ] **Step 2: Verify cards in browser**

Open http://localhost:3000. Expect:
- Clean white offer cards with image area, discount badge, green retailer pill, red sale price, round green `+` button
- Cart drawer opens and closes via header cart icon

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: card, button, drawer, grid, filter CSS"
```

---

## Chunk 4: Pages & Animations

### Task 8: Update app/page.js hero copy and CSS

**Files:**
- Modify: `app/page.js`
- Modify: `app/globals.css` (append)

- [ ] **Step 1: Update hero copy in app/page.js**

Change the `<section className="hero">` block. Replace only the content inside `<div className="hero-panel">`:

```jsx
<div className="hero-panel">
  <div className="eyebrow">{weekLabel}</div>
  <h2>Alle Deals.<br />Ein Blick.</h2>
  <p>
    RabattHunter bündelt die aktuellen Wochenangebote von ALDI, Lidl, Denns, NORMA und EDEKA —
    kategorisiert, gefiltert, auf einen Blick.
  </p>
  <div className="hero-actions">
    <Link href={`/offers?week=${weekScope}`} className="cta">
      Angebote ansehen
    </Link>
    <Link href={`/prospekte?week=${weekScope}`} className="ghost-button hero-ghost">
      Prospekte prüfen
    </Link>
  </div>
</div>
```

- [ ] **Step 2: Append homepage-specific CSS to globals.css**

Append to `app/globals.css`:

```css
/* ── Homepage Hero ──────────────────────────────────────────── */
.hero {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 20px;
  align-items: stretch;
}

.hero-panel {
  background: linear-gradient(135deg, var(--green) 0%, #0f3d22 100%);
  border-radius: var(--radius-card);
  padding: 36px 32px;
  color: #ffffff;
  position: relative;
  overflow: hidden;
}

.hero-panel::after {
  content: "";
  position: absolute;
  inset: -40% -20% -40% auto;
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, rgba(255,255,255,0.06), transparent 70%);
  pointer-events: none;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 16px;
}

.hero h2 {
  font-size: clamp(1.8rem, 3.5vw, 2.8rem);
  font-weight: 700;
  line-height: 1.1;
  margin: 0 0 12px;
  color: #ffffff;
}

.hero > .hero-panel > p {
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.9rem;
  margin: 0 0 24px;
  max-width: 44ch;
  line-height: 1.55;
}

.hero-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.hero-ghost {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.35);
  color: #ffffff;
}

.hero-ghost:hover {
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.6);
  color: #ffffff;
}

/* ── Hero stats ─────────────────────────────────────────────── */
.hero-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.stat {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  padding: 18px 20px;
  box-shadow: var(--shadow);
  font-size: 0.82rem;
  color: var(--muted);
}

.stat strong {
  display: block;
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text);
  margin-top: 6px;
}

/* ── Category grid ──────────────────────────────────────────── */
.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 14px;
}

.category-card {
  height: 140px;
  padding: 16px;
  border-radius: var(--radius-card);
  border: 1px solid rgba(0, 0, 0, 0.07);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 160ms ease, box-shadow 160ms ease;
  overflow: hidden;
}

.category-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-hover);
}

.category-card h4 {
  margin: 8px 0 2px;
  font-size: 0.9rem;
  font-weight: 600;
}

.category-card p {
  margin: 0;
  font-size: 0.75rem;
  opacity: 0.65;
}

/* ── WeekScopeSwitcher ──────────────────────────────────────── */
.filters .chip[aria-current="page"] {
  background: var(--green);
  border-color: var(--green);
  color: #ffffff;
}

/* ── RefreshDataButton ──────────────────────────────────────── */
.refresh-control {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.refresh-button {
  border: 1px solid var(--border);
  border-radius: var(--radius-btn);
  padding: 9px 16px;
  background: var(--surface);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 160ms, color 160ms;
}

.refresh-button:hover:not(:disabled) {
  border-color: var(--green);
  color: var(--green);
}

.refresh-button[disabled] {
  opacity: 0.6;
  cursor: wait;
}

.refresh-status {
  font-size: 0.8rem;
  color: var(--muted);
}

.refresh-status.success { color: var(--green); }
.refresh-status.error   { color: var(--red); }

/* ── Shopping list page ─────────────────────────────────────── */
.shopping-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(240px, 0.7fr);
  gap: 20px;
}

.shopping-list {
  display: grid;
  gap: 10px;
}

.shopping-item {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  padding: 14px 16px;
}

.shopping-item.done {
  opacity: 0.55;
}

.shopping-item.done .shopping-name {
  text-decoration: line-through;
}

.quantity-controls {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 0.875rem;
}

.info-list {
  display: grid;
  gap: 8px;
}

.retailer-summary-list {
  display: grid;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.export-actions {
  display: grid;
  gap: 8px;
  margin-top: 20px;
}

.export-status {
  margin-top: 8px;
  font-size: 0.8rem;
  color: var(--muted);
}

.panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow);
  padding: 20px;
}
```

- [ ] **Step 3: Commit**

```bash
git add app/page.js app/globals.css
git commit -m "feat: homepage hero green panel, stat cards, category grid, page-level CSS"
```

---

### Task 9: Add animations and category-card emoji display

**Files:**
- Modify: `app/globals.css` (append)
- Modify: `app/page.js` (category card emoji)

- [ ] **Step 1: Append animation CSS to globals.css**

Append to `app/globals.css`:

```css
/* ── Animations ─────────────────────────────────────────────── */
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Offer cards */
.offers-grid .offer-card { animation: fadeSlideUp 200ms ease-out both; }
.offers-grid .offer-card:nth-child(1)  { animation-delay:   0ms; }
.offers-grid .offer-card:nth-child(2)  { animation-delay:  30ms; }
.offers-grid .offer-card:nth-child(3)  { animation-delay:  60ms; }
.offers-grid .offer-card:nth-child(4)  { animation-delay:  90ms; }
.offers-grid .offer-card:nth-child(5)  { animation-delay: 120ms; }
.offers-grid .offer-card:nth-child(6)  { animation-delay: 150ms; }
.offers-grid .offer-card:nth-child(7)  { animation-delay: 180ms; }
.offers-grid .offer-card:nth-child(8)  { animation-delay: 210ms; }
.offers-grid .offer-card:nth-child(9)  { animation-delay: 240ms; }
.offers-grid .offer-card:nth-child(10) { animation-delay: 270ms; }

/* Retailer cards */
.retailer-grid .retailer-card { animation: fadeSlideUp 200ms ease-out both; }
.retailer-grid .retailer-card:nth-child(1)  { animation-delay:   0ms; }
.retailer-grid .retailer-card:nth-child(2)  { animation-delay:  30ms; }
.retailer-grid .retailer-card:nth-child(3)  { animation-delay:  60ms; }
.retailer-grid .retailer-card:nth-child(4)  { animation-delay:  90ms; }
.retailer-grid .retailer-card:nth-child(5)  { animation-delay: 120ms; }

/* Category cards */
.category-grid .category-card { animation: fadeSlideUp 200ms ease-out both; }
.category-grid .category-card:nth-child(1)  { animation-delay:   0ms; }
.category-grid .category-card:nth-child(2)  { animation-delay:  30ms; }
.category-grid .category-card:nth-child(3)  { animation-delay:  60ms; }
.category-grid .category-card:nth-child(4)  { animation-delay:  90ms; }
.category-grid .category-card:nth-child(5)  { animation-delay: 120ms; }
.category-grid .category-card:nth-child(6)  { animation-delay: 150ms; }
.category-grid .category-card:nth-child(7)  { animation-delay: 180ms; }
.category-grid .category-card:nth-child(8)  { animation-delay: 210ms; }
.category-grid .category-card:nth-child(9)  { animation-delay: 240ms; }
.category-grid .category-card:nth-child(10) { animation-delay: 270ms; }

/* Prospekt cards */
.prospekt-grid .prospekt-card { animation: fadeSlideUp 200ms ease-out both; }
.prospekt-grid .prospekt-card:nth-child(1)  { animation-delay:   0ms; }
.prospekt-grid .prospekt-card:nth-child(2)  { animation-delay:  30ms; }
.prospekt-grid .prospekt-card:nth-child(3)  { animation-delay:  60ms; }
.prospekt-grid .prospekt-card:nth-child(4)  { animation-delay:  90ms; }
.prospekt-grid .prospekt-card:nth-child(5)  { animation-delay: 120ms; }

/* ── Responsive ─────────────────────────────────────────────── */
@media (max-width: 980px) {
  .hero,
  .shopping-layout {
    grid-template-columns: 1fr;
  }

  .hero-stats {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 720px) {
  .shell {
    width: min(calc(100% - 24px), var(--max-width));
    padding-top: 20px;
  }

  .hero-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .filters form {
    flex-direction: column;
  }

  .offer-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
```

- [ ] **Step 2: Update category-card in app/page.js to show emoji**

Find the `.category-grid` mapping block and update the category card content:

```jsx
<div className="category-grid">
  {categories.map((category) => (
    <Link
      href={`/offers?week=${weekScope}&category=${category.slug}`}
      className="category-card"
      key={category.slug}
      style={{ background: category.tone, color: category.textColor }}
    >
      <div style={{ fontSize: "2rem", lineHeight: 1 }}>{category.emoji ?? "🛒"}</div>
      <div>
        <h4>{category.name}</h4>
        <p>{category.offerCount} Angebote</p>
      </div>
    </Link>
  ))}
</div>
```

> Note: `category.emoji` may not exist in the data model — `?? "🛒"` provides a safe fallback. Do not add `emoji` to the data model; this is display-only.

- [ ] **Step 3: Verify animations in browser**

Open http://localhost:3000 and hard-refresh. Cards should fade + slide up on load with a staggered delay. Hover on any card should lift it.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css app/page.js
git commit -m "feat: card entrance animations, hover effects, responsive breakpoints"
```

---

## Chunk 5: Final Cleanup

### Task 10: Verify all pages look correct

**Files:** No changes

- [ ] **Step 1: Confirm category-blob is absent**

The `<div className="category-blob" />` line was already removed as part of Task 9 Step 2 (the entire category card block was replaced). Confirm it is not present in `app/page.js` — no action needed.

- [ ] **Step 2: Verify all four pages look correct**

- http://localhost:3000 — Homepage: green hero, stat cards, category grid, offer cards with animations
- http://localhost:3000/offers — Offers page: filter bar, offer grid
- http://localhost:3000/prospekte — Prospekte page: cards with retailer accent + action buttons
- http://localhost:3000/shopping-list — Shopping list: two-column layout

- [ ] **Step 3: Check browser console for errors**

Open DevTools → Console. Expect zero errors. Common issues to watch for:
- `Cannot read properties of undefined` on `category.emoji` — handled by `?? "🛒"` fallback
- Font 404 — would show as Inter not loading; check network tab

- [ ] **Step 4: Final commit**

```bash
git add app/page.js
git commit -m "feat: remove category-blob, final cleanup"
```

---

### Task 11: Verify existing tests still pass

**Files:** No changes

- [ ] **Step 1: Run test suite**

```bash
npm test
```

Expected: All tests pass. The tests cover data parsing adapters and classification — none touch UI components, so no failures expected.

- [ ] **Step 2: If tests fail, investigate**

If any test fails it is unrelated to UI changes (we touched no `lib/` or `ingest/` code). Check if the test was already failing before this work:

```bash
git stash && npm test
```

If it fails on a clean checkout, it was pre-existing. Document and move on.

- [ ] **Step 3: Commit test results note (only if pre-existing failures found)**

```bash
git commit --allow-empty -m "chore: note pre-existing test failures (unrelated to UI redesign)"
```
