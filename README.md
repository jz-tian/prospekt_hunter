# RabattHunter

**Live German supermarket discount tracker — built as a full-stack portfolio project.**

Aggregates weekly deals from five major German supermarkets (ALDI, Lidl, NORMA, EDEKA, Denns BioMarkt), categorises them automatically, and presents them in a filterable, mobile-friendly interface. Data is fetched in real time from official retailer APIs and HTML pages — no third-party data providers.

**Live demo:** [rabatthunter.vercel.app](https://rabatthunter.vercel.app) · **Portfolio:** [jiazheng.dev](https://jiazheng.dev)

---

## Features

| Feature | Details |
|---|---|
| **5 live retailer adapters** | ALDI Süd, Lidl, NORMA, EDEKA, Denns BioMarkt |
| **Current + next week** | Toggle between the active and upcoming weekly flyer |
| **Auto-categorisation** | Rule-based classifier assigns every offer a category (Obst & Gemüse, Fleisch, Getränke, …) |
| **Retailer filter** | Toggle individual retailers on/off |
| **Category filter** | Filter by product category |
| **Search** | Full-text search across offer names |
| **Shopping list** | Add offers to a persistent cart, check them off, see per-retailer and total costs |
| **Export** | Export cart as plain text or CSV |
| **Prospekte overview** | Browse flyer covers and validity dates per retailer |
| **Admin ingest** | Password-protected "Refresh data" button that triggers a live scrape |
| **Responsive** | Fully usable on mobile; drawer z-index correctly stacked above the header |
| **PWA-ready** | Custom SVG favicon, theme colour, Open Graph meta |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, React 19) |
| Database | [Turso](https://turso.tech) (libSQL — cloud SQLite, free tier) |
| DB client | `@libsql/client` |
| Styling | Plain CSS (no UI library) |
| Fonts | DM Sans + Bricolage Grotesque (Google Fonts via Next.js) |
| Deployment | Vercel (serverless, zero config) |
| Data sources | Official retailer APIs & HTML pages (no third-party data provider) |

---

## Architecture

```
app/
├── page.js                    # Home — offer grid with filters
├── prospekte/page.js          # Flyer overview
├── layout.js                  # Root layout, metadata, fonts
├── globals.css                # All styles
└── api/
    ├── offers/                # GET offers (filtered)
    ├── categories/            # GET distinct categories
    ├── prospekte/             # GET flyer metadata
    ├── shopping-list/         # CRUD shopping cart (stored in DB per-session)
    ├── refresh/               # POST — triggers ingest (password-protected)
    └── admin/ingest/          # POST run / GET status

components/
├── site-shell.js              # Header, search, nav, shopping drawer trigger
├── offers-filter.js           # Retailer + category filter UI
├── shopping-list-drawer.js    # Slide-in cart panel
├── shopping-list-client.js    # Cart item interactions
├── demo-banner.js             # Dismissible portfolio banner
└── refresh-data-button.js     # Admin password gate + ingest trigger

lib/
├── db.js                      # Turso client, schema init, all DB queries
├── classification.js          # Rule-based offer categoriser
├── constants.js               # Retailer IDs, category list
└── ingest/
    ├── index.js               # Orchestrates a full ingest run
    └── adapters/
        ├── aldi.js            # ALDI Süd — Publitas JSON + HTML fallback
        ├── lidl.js            # Lidl — leaflets.schwarz v4 API
        ├── norma.js           # NORMA — HTML scrape of themed offer pages
        ├── edeka.js           # EDEKA — market-specific JSP + page-data
        └── denns.js           # Denns BioMarkt — Gatsby page-data JSON
```

**Data flow:**

1. A POST to `/api/refresh` (or `/api/admin/ingest/run`) triggers `runIngestion(weekScope)`.
2. Each adapter fetches from the retailer's official public endpoints (no login required).
3. Offers are written to Turso; the classifier assigns categories in a single batch update.
4. The Next.js page re-fetches via `router.refresh()` — no full reload needed.

---

## Local Development

### Prerequisites

- Node.js 20+
- A local SQLite file is used automatically in development — no Turso account needed to get started.

### Setup

```bash
git clone https://github.com/jz-tian/prospekt_hunter.git
cd prospekt_hunter
npm install
```

Create `.env.local`:

```env
# Local dev — uses an embedded SQLite file, no cloud account needed
TURSO_DATABASE_URL=file:.data/local.db
ADMIN_PASSWORD=your-admin-password

# Retailer-specific market configuration
EDEKA_MARKET_ID=10003350          # Find your EDEKA market ID on edeka.de
DENNS_MARKET_SLUG=muenchen-regerstr  # Slug from biomarkt.de/<slug>/angebote
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Run an ingest

The database starts empty. Click **"Daten aktualisieren"** in the header (uses the password from `ADMIN_PASSWORD`), or run:

```bash
curl -X POST 'http://localhost:3000/api/refresh?week=current' \
  -H 'Authorization: Bearer your-admin-password'
```

For next week's data:

```bash
curl -X POST 'http://localhost:3000/api/refresh?week=next' \
  -H 'Authorization: Bearer your-admin-password'
```

### Finding your market IDs

**EDEKA** — navigate to your local EDEKA on [edeka.de](https://edeka.de), select a store, and extract the numeric ID from the URL (e.g. `10003350`).

**Denns BioMarkt** — go to [biomarkt.de](https://www.biomarkt.de), select your store, and copy the slug from the URL (e.g. `muenchen-regerstr`).

---

## Deploying to Vercel

### 1 — Create a Turso database

```bash
npm install -g @turso/cli
turso auth login
turso db create rabatthunter
```

To seed with existing local data:

```bash
turso db create rabatthunter --from-file .data/local.db
```

Get the connection details:

```bash
turso db show rabatthunter        # copy the libsql:// URL
turso db tokens create rabatthunter
```

### 2 — Set environment variables in Vercel

In your Vercel project → **Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `TURSO_DATABASE_URL` | `libsql://rabatthunter-<your-org>.turso.io` |
| `TURSO_AUTH_TOKEN` | *(token from step 1)* |
| `ADMIN_PASSWORD` | A strong password for the ingest button |
| `EDEKA_MARKET_ID` | Your EDEKA market ID |
| `DENNS_MARKET_SLUG` | Your Denns market slug |

### 3 — Deploy

```bash
vercel --prod
```

Or connect the GitHub repo in the Vercel dashboard for automatic deploys on push.

> **Note:** Vercel functions are serverless — the filesystem is ephemeral. Turso is the only persistent store. All data survives deploys and cold starts.

---

## Retailer Adapters

| Retailer | Data source | Current week | Next week |
|---|---|---|---|
| **ALDI Süd** | Publitas JSON prospekt + HTML fallback | ✓ | ✓ |
| **Lidl** | `endpoints.leaflets.schwarz` v4 API | ✓ | ✓ |
| **NORMA** | HTML scrape of `norma-online.de/angebote` | ✓ | ✓ |
| **EDEKA** | Market JSP + `__NEXT_DATA__` + catalog XML | ✓ | ✓ (when available) |
| **Denns BioMarkt** | Gatsby `page-data.json` | ✓ | ✓ |

All adapters use plain `fetch` — no browser automation, no Puppeteer, no paid proxies.

---

## Database Schema

```sql
-- Ingest run metadata (one row per scrape job)
ingest_runs (id, week_scope, started_at, completed_at, offer_count, status, detail)

-- Retailer flyer metadata
issues (id, retailer, week_scope, title, valid_from, valid_to, flyer_url, cover_url, ingest_run_id)

-- Individual offer records
offers (id, issue_id, retailer, week_scope, name, brand, price, original_price,
        promo_label, image_url, product_url, description, valid_from, valid_to,
        source_section, category, ingest_run_id)

-- Shopping cart (client-side session key)
shopping_items (id, session_key, offer_id, quantity, checked, added_at)

-- App-level key-value flags (e.g. seed version)
app_state (key, value)
```

---

## License

MIT — feel free to fork, adapt, or use as a reference for your own portfolio projects.

---

*Built by [Jiazheng Tian](https://jiazheng.dev) · Next.js 15 · Turso · React 19*
