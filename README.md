# AngebotsRadar

AngebotsRadar ist ein lokales Next.js-Webapp-MVP für die Aggregation von Wochenangeboten aus den Prospekten von `ALDI`, `Lidl`, `REWE` und `EDEKA`.

## Status

Stand vom `2026-03-13`:

- `ALDI` und `Lidl` sind als echte Live-Adapter angebunden
- `EDEKA` hat jetzt einen echten Live-Adapter für Prospekt-Metadaten und aktuelle Angebotsseiten
- `REWE` läuft weiter über Fixture-Daten
- Startseite, Angebotsliste und Prospektseite lesen ohne implizite Schreibzugriffe direkt aus der lokalen Datenbank
- Die App unterstützt `current` und `next` week scope
- Im Produktmodell werden aktuell nur stabile Felder genutzt:
  - Produktname
  - Marke
  - aktueller Angebotspreis
  - Produktbild
  - Produkt-URL
  - Kategorie / Beschreibung / Gültigkeit
- Originalpreis und Rabatt-Prozent sind bewusst aus der aktiven Produktlogik entfernt worden

## Enthalten

- Next.js App Router Frontend mit Startseite, Angebotsliste, Prospektübersicht und Einkaufsliste
- SQLite-basierte lokale Persistenz über `node:sqlite`
- Interne API-Routen für Angebote, Prospekte, Kategorien, Einkaufsliste und Admin-Ingest
- Adapter-Architektur für Prospekt-Ingestion
- Fixture-basierte Seed-Daten für noch nicht angeschlossene Händler
- Echte Live-Adapter für `ALDI`, `Lidl` und `EDEKA`

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
- Ein manueller Ingest läuft nur über den Button `Daten aktualisieren` oder über die Admin-API

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
curl -X POST 'http://127.0.0.1:3001/api/admin/ingest/run?week=current'
```

Nächste Woche:

```bash
curl -X POST 'http://127.0.0.1:3001/api/admin/ingest/run?week=next'
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
- Quelle für Angebotsdaten: offizielle ALDI-Angebotsseiten `https://www.aldi-sued.de/angebote/{date}`
- Bereits live:
  - Prospekt-Links für aktuelle und nächste Woche
  - Angebotsname
  - Marke
  - Preis
  - Produktbild
  - Produkt-URL
  - einfache unitInfo aus Produkt-Tiles
  - current/next week Auswahl
- Technischer Ansatz:
  - keine separate Viewer-API nötig
  - strukturierte Daten kommen serverseitig gerendert aus den offiziellen HTML-Seiten

Stand der letzten lokalen Verifikation vom `2026-03-12`:

- ALDI `current`: `29` offers
- ALDI `next`: `30` offers

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

### REWE

- Noch kein echter Live-Adapter
- Daten kommen weiter aus `lib/sample-data.js`

## Nächste sinnvolle Schritte

1. Lidl-Kategorisierung verbessern, da Lidl-eigene Kategorien aktuell nur grob auf die gemeinsame Taxonomie gemappt werden
2. ALDI-Kategorisierung verbessern, da der aktuelle HTML-Tile-Adapter noch keine sauberen Source-Sections liefert
3. Für EDEKA einen Markt mit früh veröffentlichtem next-week-Flyer finden, um den live `next`-Pfad gegen echte Daten zu verifizieren
4. REWE nur dann angehen, wenn für die Cloudflare-Sperre ein tragfähiger Ansatz feststeht
5. Falls Originalpreis später wieder relevant wird, nur mit einer separaten, sauber validierten Extraktionsstrategie neu einführen

## Übergabe

Für den nächsten Agenten ist die wichtigste technische Übergabe in [HANDOFF.md](/Users/jiazheng/idol/claude_projects/supermarket_discount/HANDOFF.md) dokumentiert.

## Architekturhinweis

Die Adapter liegen unter `lib/ingest/adapters/`. Die Zielstruktur pro Adapter ist:

1. Prospekt-URL oder Filialseite entdecken
2. Strukturierte Viewer-Daten oder PDF-Metadaten abrufen
3. Produkte, Bilder, Preise und Gültigkeit extrahieren
4. In das standardisierte `issue + offers` Format überführen

Die restliche UI, das SQLite-Schema und die APIs sind bereits auf diese Datenstruktur ausgelegt.
