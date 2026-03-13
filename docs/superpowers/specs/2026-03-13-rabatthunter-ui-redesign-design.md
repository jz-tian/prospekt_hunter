# RabattHunter UI Redesign — Design Spec

**Date:** 2026-03-13
**Project:** supermarket_discount (AngebotsRadar → RabattHunter)
**Approach:** Pure CSS rewrite + minimal JSX changes. Zero changes to data logic, API routes, or lib/.

---

## 1. Goals

- Rename app from "AngebotsRadar" to "RabattHunter"
- Replace warm-cream glassmorphism aesthetic with clean, modern, premium design inspired by reference grocery e-commerce UI (FreshyMart style)
- Unify typography, spacing, and color across all 4 pages
- Add subtle card entrance animations and hover effects
- Integrate placeholder global search bar in header
- Handle mixed-background product images gracefully

---

## 2. Design System

### Colors
```css
--green:        #1a5c35   /* primary — header bg, CTA buttons, accents */
--green-mid:    #2d7a4f   /* hover state for green elements */
--green-light:  #e8f2ec   /* badge/chip backgrounds */
--red:          #d42b2b   /* sale/discount badges */
--text:         #1a1a1a   /* body text */
--muted:        #6b7280   /* secondary/helper text */
--bg:           #f5f6f5   /* page background (very light gray-green) */
--surface:      #ffffff   /* card surface */
--border:       #e5e7e5   /* borders and dividers */
--shadow:       0 4px 16px rgba(0,0,0,0.07)
--shadow-hover: 0 8px 24px rgba(0,0,0,0.12)
```

### Typography
- **Font:** Inter (loaded via `next/font/google`, subset: latin)
- **Scale:**
  - Hero title: `clamp(2rem, 4vw, 3.2rem)`, weight 700
  - Section headings (h3): `1.25rem`, weight 600
  - Card titles (h4): `0.95rem`, weight 600, 2-line clamp
  - Body: `0.9rem`, weight 400
  - Price (sale): `1.4rem`, weight 800
  - Labels/badges: `0.75rem`, weight 700
  - Muted text: `0.8rem`, weight 400

### Spacing & Radius
- Card border-radius: `16px`
- Button border-radius: `12px`
- Pill/badge border-radius: `999px`
- Search bar border-radius: `999px`
- Base grid gap: `16px`
- Section margin-top: `32px`

---

## 3. Header (two-layer)

### Top bar
- Background: `#1a5c35` (deep forest green)
- Height: ~56px
- Layout: `Logo | Search bar (center, ~40% width) | Cart icon`
- **Logo wordmark:** `RH·` (white, 700 weight) + `RabattHunter` (rgba(255,255,255,0.75), 400 weight). No external image — pure HTML/CSS text.
- **Search bar:** white background, `border-radius: 999px`, placeholder "Produkte suchen…", `disabled` attribute (placeholder for future feature), 🔍 icon left
- **Cart button (header):** SVG cart icon + white count badge, right-aligned. Extracted as a tiny `"use client"` component `CartHeaderButton`. On click it fires `window.dispatchEvent(new CustomEvent("toggle-shopping-drawer"))`. `SiteShell` stays a Server Component.
- `ShoppingListDrawer` listens for `"toggle-shopping-drawer"` event (alongside existing `"shopping-list-updated"`) and calls `setOpen(v => !v)`. The existing floating trigger button inside the drawer is **removed** — the header button is the sole trigger.

### Bottom nav bar
- Background: `#ffffff`
- Border-bottom: `1px solid var(--border)`
- Links: Start, Angebote, Prospekte, Einkaufsliste
- Active link: `color: var(--green)`, `font-weight: 600`, green bottom border `2px`
- Hover: `color: var(--green)`
- Font size: `0.875rem`
- Active state detection: extract a new `"use client"` component `NavLinks` from `site-shell.js`. It uses `usePathname()` to apply `.active` class. It renders the first 3 links (Start, Angebote, Prospekte) itself, then renders `<ShoppingListNavLink />` as the 4th item (unchanged — that component already handles its own count badge). `SiteShell` remains a Server Component and simply renders `<NavLinks />`.

---

## 4. Page Backgrounds & Shell

- Remove gradient radial backgrounds from body
- Body background: `var(--bg)` — flat `#f5f6f5`
- **Header is full-bleed** (spans 100vw), NOT inside `.shell`. DOM structure:
  ```
  <body>
    <header class="site-header">   ← full width, outside shell
      <div class="header-inner">  ← max-width 1360px, centered
        top bar content...
      </div>
      <div class="header-inner">
        nav bar content...
      </div>
    </header>
    <div class="shell">            ← page content, max-width 1360px
      {children}
    </div>
  </body>
  ```
- `.shell` padding-top: `0` (header is not sticky/fixed — normal flow). Body has no extra padding-top needed.
- Remove `backdrop-filter` / glassmorphism from all cards

---

## 5. Offer Card

```
┌─────────────────────────┐
│  [  image area 160px  ] │  ← bg: #f5f7f5, img: mix-blend-mode: multiply
│                    [badge: -20%]  ← red pill, top-right absolute
├─────────────────────────┤
│ [ALDI pill]             │  ← green-light bg, green text, 0.7rem
│ Rispentomaten           │  ← 0.95rem, 600w, 2-line clamp
│ 500g · Farm Fresh       │  ← 0.8rem muted, 1-line clamp
│                         │
│ 1,99 €  ~~2,49 €~~      │  ← red 1.4rem 800w + muted strikethrough
│                         │
│ Gültig 10.–15.03   [+]  │  ← muted 0.75rem + green round button
└─────────────────────────┘
```

- Discount badge: shown only when `offer.originalPrice` exists. Always compute in JSX: `Math.round((1 - offer.salePrice / offer.originalPrice) * 100)`. Show as `-XX%`. (No `discountPercent` field used — computed client-side is sufficient.)
- `+` button: delegated to `AddToListButton` component — rendered as round 32px green icon button with `aria-label`
- Card hover: `translateY(-3px)` + `var(--shadow-hover)`, `transition: 160ms`

---

## 6. Animations

```css
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

- Applied to: `.offer-card`, `.retailer-card`, `.prospekt-card`, `.category-card`
- Duration: `200ms ease-out`
- Stagger via explicit nth-child rules (write out 1–10):
  ```css
  .offers-grid .offer-card:nth-child(1)  { animation-delay: 0ms; }
  .offers-grid .offer-card:nth-child(2)  { animation-delay: 30ms; }
  /* ... up to nth-child(10) at 270ms */
  ```
  Same pattern for `.retailer-grid`, `.category-grid`, `.prospekt-grid`
- Card hover: `transform: translateY(-3px)`, `box-shadow: var(--shadow-hover)`, `transition: transform 160ms, box-shadow 160ms`

---

## 7. Homepage Layout

### Hero
- Two-column grid: `1.2fr 0.8fr`, gap 20px
- Left panel: dark green gradient background, white text, tagline + 2 CTA buttons
  - Primary CTA: white background, green text ("Angebote ansehen")
  - Secondary CTA: transparent, white border, white text ("Prospekte prüfen")
- Right panel: 2×2 grid of stat cards (white surface, `var(--shadow)`)

### Retailer Status section
- Horizontal card row (auto-fit, min 200px)
- Left: 4px green accent line (retailer color)
- Content: retailer name (600w), offer count, date range

### Category Grid
- `auto-fit, minmax(150px, 1fr)`
- Smaller cards: height 140px, emoji icon (2rem) + name (0.9rem 600w) + count (0.75rem muted)
- Subtle colored backgrounds (retain existing `category.tone`)

### Featured Offers
- 4-column grid → offer cards with animation

---

## 8. Offers Page

- Filter bar: single-row flex, search input + retailer select + category select + week chips
- All in a white panel with border, `border-radius: 16px`, padding 16px
- Results count chip: right-aligned, green-light bg
- Grid: `auto-fit, minmax(220px, 1fr)`

---

## 9. Prospekte Page

- 3-column grid, `minmax(280px, 1fr)`
- Card structure: colored top accent bar (4px, retailer color) → retailer pill → title → date → count → source badge → action buttons
- Source badge: "Live-Daten" in green-light, "Beispieldaten" in gray

---

## 10. Shopping List Page

- Two-column layout: `1.3fr 0.7fr`
- Left: grouped list by retailer, items with round green checkbox, quantity controls
- Right: sticky summary panel — total items, total price, export buttons
- Empty state: centered illustration placeholder + text

---

## 11. Shopping List Drawer (floating)

- Floating button: bottom-right, green, SVG cart icon (replace text "Einkaufsliste")
- Drawer panel: white background, `border-radius: 20px`, no blur effect
- Close button: X icon, 32px circle

---

## 12. Files Changed

| File | Change |
|------|--------|
| `app/globals.css` | Full rewrite — new tokens, all component styles, animations |
| `app/layout.js` | Add `next/font/google` Inter, apply `inter.className` to `<html>`, update metadata for RabattHunter. Use `var(--font-inter)` in globals.css, not hard-coded `'Inter'` |
| `components/site-shell.js` | Restructure: full-width green `<header>` lives OUTSIDE `.shell` wrapper so it spans full viewport. White nav bar inside. New Logo wordmark. Search input. Renders `<CartHeaderButton />` and `<NavLinks />` as client sub-components. |
| `components/offer-card.js` | Image area with blend-mode, tighter layout, `+` icon button (round 32px). Discount percentage computed in JSX: `Math.round((1 - salePrice / originalPrice) * 100)` shown as badge |
| `components/add-to-list-button.js` | Button becomes icon-only round `+` with `aria-label="Zur Einkaufsliste hinzufügen"`, pending/done states via SVG icon swap |
| `components/shopping-list-drawer.js` | Floating trigger button: SVG cart icon replaces text "Einkaufsliste". Close button: SVG X icon (not text `x`). Panel: white bg, no blur, `border-radius: 20px` |
| `app/page.js` | Hero copy: title "Alle Deals. Ein Blick.", subtitle "RabattHunter bündelt die aktuellen Wochenangebote von ALDI, Lidl, Denns, NORMA und EDEKA — kategorisiert, gefiltert, auf einen Blick." |

**Not changed:** All API routes, `lib/`, `components/shopping-list-client.js` internal logic, `components/offers-filter.js` logic, `components/shopping-list-nav-link.js` logic, database.

---

## 13. Additional Component Notes

### WeekScopeSwitcher
- Styled as a small pill-group toggle: "Diese Woche" / "Nächste Woche", green background for active, white ghost for inactive
- Border: `1px solid var(--border)`, `border-radius: 999px`, inline-flex

### RefreshDataButton
- Ghost button style with subtle border, `border-radius: 12px`
- Loading state: opacity 0.6 + "…" suffix

### Category card
- Remove `.category-blob` decorative element
- Height: `140px`, padding `16px`
- Top: emoji (2rem) — retain `category.tone` background color
- Bottom: name (0.9rem 600w) + count (0.75rem muted)

### Product image handling
- Primary: `object-fit: contain`, image container bg `#f5f7f5`
- Enhancement: `mix-blend-mode: multiply` on `<img>` — effective for white/light-bg product shots (ALDI, EDEKA, NORMA, Lidl).
- **Known exception:** Denns BioMarkt images come from Sanity CDN and often have coloured/photographic backgrounds — `multiply` may darken them. This is an accepted visual trade-off; no fallback needed at this stage.

### AddToListButton done-state
- After successful add, button shows a checkmark SVG icon. State is **persistent** (matches current behaviour — no auto-reset). `aria-label` changes to "Bereits in der Einkaufsliste".

### Mobile header (≤768px)
- Green top bar: Logo + Cart icon only (search bar hidden)
- White nav bar: all 4 links in a horizontally scrollable row, `overflow-x: auto`, no wrapping

---

## 14. Out of Scope

- Search functionality implementation (UI placeholder only)
- Mobile responsive overhaul (maintain existing breakpoints, improve but not redesign)
- Dark mode
- Image optimization/proxying
