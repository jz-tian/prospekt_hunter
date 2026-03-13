# AngebotsRadar

AngebotsRadar ist ein lokales Next.js-Webapp-MVP für die Aggregation von Wochenangeboten aus den Prospekten von `ALDI`, `Lidl`, `Denns BioMarkt` und `EDEKA`.

## Status

Stand vom `2026-03-13`:

- `ALDI` und `Lidl` sind als echte Live-Adapter angebunden
- `EDEKA` hat jetzt einen echten Live-Adapter für Prospekt-Metadaten und aktuelle Angebotsseiten
- `Denns BioMarkt` ist jetzt als Live-Adapter über die offizielle Angebotsseite mit strukturierter `page-data` angebunden
- Das Repo ist jetzt unter `https://github.com/jz-tian/prospekt_hunter.git` auf `main` versioniert
- Startseite, Angebotsliste und Prospektseite lesen ohne implizite Schreibzugriffe direkt aus der lokalen Datenbank
- Die App unterstützt `current` und `next` week scope
- Im Produktmodell werden aktuell nur stabile Felder genutzt:
  - Produktname
  - Marke
  - aktueller Angebotspreis
  - offizieller Streichpreis, wenn die Quelle ihn sauber liefert
  - Promo-Label für offizielle Coupon-Karten ohne Euro-Preis
  - Produktbild
  - Produkt-URL
  - Kategorie / Beschreibung / Gültigkeit
- Rabatt-Prozent als eigener numerischer Kernwert bleibt weiterhin außen vor

## Enthalten

- Next.js App Router Frontend mit Startseite, Angebotsliste, Prospektübersicht und Einkaufsliste
- SQLite-basierte lokale Persistenz über `node:sqlite`
- Interne API-Routen für Angebote, Prospekte, Kategorien, Einkaufsliste und Admin-Ingest
- Adapter-Architektur für Prospekt-Ingestion
- Fixture-basierte Seed-Daten für Start- und Demo-Zustände
- Echte Live-Adapter für `ALDI`, `Lidl`, `Denns BioMarkt` und `EDEKA`

## Start

```bash
npm install
npm run build
npm run start -- --hostname 127.0.0.1 --port 3001
```

Danach im Browser öffnen:

```bash
http://127.0.0.1:3001
```

Wichtig:

- Beim Öffnen von `/`, `/offers` und `/prospekte` wird kein automatischer Ingest gestartet
- Ein manueller Ingest läuft nur über den Button `Daten aktualisieren` oder über die Refresh-API

## EDEKA Markt wechseln

Der EDEKA-Adapter liest die Markt-ID aus `EDEKA_MARKET_ID`.

Beispiel:

```bash
cp .env.example .env.local
```

Dann in `.env.local` setzen:

```bash
EDEKA_MARKET_ID=17290
```

Danach den Next.js-Server neu starten.

## Ingest manuell ausführen

Aktuelle Woche:

```bash
curl -X POST 'http://127.0.0.1:3001/api/refresh?week=current'
```

Nächste Woche:

```bash
curl -X POST 'http://127.0.0.1:3001/api/refresh?week=next'
```

## Live-Datenstatus nach Händler

### Lidl

- Quelle für Prospekt-Übersicht: offizielle Lidl-Prospektseite
- Quelle für Flyer-Details: offizieller viewer endpoint `https://endpoints.leaflets.schwarz/v4/flyer`
- Bereits live:
  - Prospekt-Metadaten
  - Produktname
  - Marke
  - Preis
  - Produktbild
  - Produkt-URL
  - current/next week Auswahl
- Nicht mehr Teil des aktiven Scopes:
  - Originalpreis
  - Rabatt-Prozent

Stand der letzten lokalen Verifikation vom `2026-03-12`:

- Lidl `current`: `150` offers, `150` mit Bild
- Lidl `next`: `126` offers, `126` mit Bild

### ALDI

- Quelle für Prospekt-Übersicht: offizielle ALDI-Prospektseite `https://www.aldi-sued.de/prospekte`
- Primäre Quelle für Angebotsdaten: offizieller ALDI-Publitas-Prospekt
  - `https://prospekt.aldi-sued.de/<slug>/data.json`
  - `https://prospekt.aldi-sued.de/<slug>/page/{n}/hotspots_data.json?version=...`
- Fallback-Quelle: offizielle Angebotsseiten `https://www.aldi-sued.de/angebote/{date}`
- Bereits live:
  - Prospekt-Links für aktuelle und nächste Woche
  - Angebotsname
  - Marke
  - Preis
  - Produktbild
  - Produkt-URL
  - unitInfo aus offiziellen Prospekt-Produkt-Hotspots
  - current/next week Auswahl
- Technischer Ansatz:
  - bevorzugt werden offizielle Prospekt-JSONs (`data.json` + `hotspots_data.json`)
  - die alte HTML-Tile-Extraktion aus `/angebote/{date}` bleibt nur als Fallback erhalten

Stand der letzten lokalen Verifikation vom `2026-03-13`:

- ALDI `current`: `183` offers, `183` mit Bild
- ALDI `next`: `30` offers, `30` mit Bild

### EDEKA

- Quelle für Prospekt-Metadaten: offizielles `prospekt.jsp` inklusive `__NEXT_DATA__`
- Quelle für offizielle Gültigkeit: `blaetterkatalog/xml/catalog.xml`
- Quelle für aktuelle Angebotsdaten: offizielles `angebote.jsp`
- Bereits live:
  - Marktabhängige Prospekt-Metadaten
  - Gültigkeit des aktuellen Flyers
  - aktuelle Angebotskarten aus der serverseitig gerenderten Angebotsseite
  - Produktname
  - Preis
  - Bild
  - Kategorie / Beschreibung / Gültigkeitstext
- `next` week:
  - Erkennung ist implementiert
  - funktioniert, sobald der gewählte Markt auf offiziellen EDEKA-Seiten bereits einen zukünftigen Flyer veröffentlicht
  - Stand `2026-03-13`: in einer lokalen Stichprobe mehrerer offizieller Märkte wurde noch kein Markt mit vorab veröffentlichtem next-week-Flyer gefunden

Stand der letzten lokalen Verifikation vom `2026-03-13`:

- EDEKA `current`: `202` offers, `202` mit Bild

### Denns BioMarkt

- Quelle für Angebotsdaten: offizielle Markt-Angebotsseite `https://www.biomarkt.de/<markt>/angebote`
- Quelle für strukturierte Daten: offizielles Gatsby `page-data.json` der Angebotsseite
- Bereits live:
  - aktueller offizieller Markt-Feed der Angebotsseite
  - current-Ansicht nahe an der realen offiziellen Angebotsseite
  - next-Ansicht auf Basis offizieller Gültigkeitsfenster
  - Angebotsname
  - Marke
  - Preis und App-Preis
  - Streichpreis, wenn im offiziellen Feed vorhanden
  - Promo-Karten wie `10% Rabatt` als Label-Karten
  - Produktbild
  - Gruppierung aus offiziellen Angebotsgruppen
- Technischer Ansatz:
  - kein Browser- oder Session-Handling
  - JSON direkt aus der offiziellen Gatsby-`page-data`
  - Prospekt-Link wird aus der offiziellen Angebotsseiten-Konfiguration abgeleitet
  - App-only-Karten und Coupon-Karten werden nicht mehr stillschweigend weggefiltert

Stand der letzten lokalen Verifikation vom `2026-03-13`:

- offizielles Denns `page-data`: `12` Karten für `muenchen-regerstr`
- davon werden aktuelle Produkt- und Promo-Karten jetzt vollständig in die App übernommen

## Nächste sinnvolle Schritte

1. Lidl-Kategorisierung verbessern, da Lidl-eigene Kategorien aktuell nur grob auf die gemeinsame Taxonomie gemappt werden
2. ALDI-Kategorisierung verbessern, da die offiziellen Prospekt-Produkttypen noch nicht sauber auf die gemeinsame Taxonomie gemappt werden
3. Für EDEKA einen Markt mit früh veröffentlichtem next-week-Flyer finden, um den live `next`-Pfad gegen echte Daten zu verifizieren
4. Falls Denns später weitere Marktspezifika braucht, `DENNS_MARKET_SLUG` pro Deployment passend setzen
5. Falls Denns später wieder näher an das vollständige Prospekt gebracht werden soll, einen zweiten Pfad für PDF/Viewer-Ergänzung zusätzlich zum offiziellen `page-data` bauen

## Übergabe

Für den nächsten Agenten ist die wichtigste technische Übergabe in [HANDOFF.md](/Users/jiazheng/idol/claude_projects/supermarket_discount/HANDOFF.md) dokumentiert.

## Architekturhinweis

Die Adapter liegen unter `lib/ingest/adapters/`. Die Zielstruktur pro Adapter ist:

1. Prospekt-URL oder Filialseite entdecken
2. Strukturierte Viewer-Daten oder offizielle Seiten-JSONs abrufen
3. Produkte, Bilder, Preise und Gültigkeit extrahieren
4. In das standardisierte `issue + offers` Format überführen

Die restliche UI, das SQLite-Schema und die APIs sind bereits auf diese Datenstruktur ausgelegt.
