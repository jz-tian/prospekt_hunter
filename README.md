# RabattHunter

**Live German supermarket discount tracker — built as a full-stack portfolio project.**

Aggregates weekly deals from five major German supermarkets (ALDI, Lidl, NORMA, EDEKA, Denns BioMarkt), categorises them automatically, and presents them in a filterable, mobile-friendly interface. Data is fetched in real time from official retailer APIs and HTML pages — no third-party data providers.

**Live demo:** [rabatthunter.vercel.app](https://rabatthunter.vercel.app) · **Portfolio:** [jz-tian.github.io](https://jz-tian.github.io)

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
| **Responsive** | Fully usable on mobile |
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
    ├── shopping-list/         # CRUD shopping cart
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

1. A POST to `/api/refresh` triggers `runIngestion(weekScope)`.
2. Each adapter fetches from the retailer's official public endpoints (no login required).
3. Offers are written to Turso; the classifier assigns categories in a single batch update.
4. The Next.js page re-fetches via `router.refresh()` — no full reload needed.

---

## Local Development

### Prerequisites

- Node.js 20+
- No Turso account needed — a local SQLite file is used automatically in development.

### Setup

```bash
git clone https://github.com/jz-tian/prospekt_hunter.git
cd prospekt_hunter
npm install
```

Create `.env.local`:

```env
TURSO_DATABASE_URL=file:.data/local.db
ADMIN_PASSWORD=your-admin-password

EDEKA_MARKET_ID=10003350
DENNS_MARKET_SLUG=muenchen-regerstr
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Fetching live data

The database starts empty. Click **"Daten aktualisieren"** in the header and enter your `ADMIN_PASSWORD`, or use curl:

```bash
# Current week
curl -X POST 'http://localhost:3000/api/refresh?week=current' \
  -H 'Authorization: Bearer your-admin-password'

# Next week
curl -X POST 'http://localhost:3000/api/refresh?week=next' \
  -H 'Authorization: Bearer your-admin-password'
```

### Finding your market IDs

**EDEKA** — go to [edeka.de](https://edeka.de), select your store, and extract the numeric ID from the URL (e.g. `10003350`).

**Denns BioMarkt** — go to [biomarkt.de](https://www.biomarkt.de), select your store, and copy the slug from the URL (e.g. `muenchen-regerstr`).

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

## License

MIT — feel free to fork, adapt, or use as a reference for your own portfolio projects.

---

*Built by [Jiazheng Tian](https://jz-tian.github.io) · Next.js 15 · Turso · React 19*
