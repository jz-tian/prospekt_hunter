# Handoff

## Current State

Dieses Repo ist nicht mehr nur ein UI-Mock. Mehrere echte Händler sind bereits angebunden:

- `Lidl` und `ALDI` laufen über Live-Daten
- `EDEKA` läuft über Live-Prospekt-Metadaten und aktuelle Angebotsseiten
- `REWE` läuft noch über Fixture-Daten
- Das Repo ist nach `main` auf `https://github.com/jz-tian/prospekt_hunter.git` gepusht

Die App läuft lokal stabil mit:

```bash
npm run build
npm run start -- --hostname 127.0.0.1 --port 3001
```

Zusätzlich gilt jetzt:

- `app/page.js`, `app/offers/page.js` und `app/prospekte/page.js` lesen nur noch die lokale Datenbank
- die öffentlichen APIs `/api/offers`, `/api/prospekte` und `/api/categories` triggern keinen Ingest mehr
- ein Ingest läuft nur noch explizit über den Button `Daten aktualisieren` oder über `/api/admin/ingest/run`

## Active Product Scope

Der aktuelle Scope wurde bewusst vereinfacht:

- Produktname
- Marke
- Angebotspreis
- Produktbild
- Produkt-URL
- Kategorie / Beschreibung
- Prospekt-Gültigkeit
- Einkaufsliste

Nicht mehr Teil der aktiven Produktlogik:

- Originalpreis
- Rabatt-Prozent

Der Grund ist Datenqualität: Die alten Preisfelder ließen sich für Lidl nicht stabil genug aus offiziellen Seiten ableiten, ohne wieder falsche Werte zu riskieren.

## What Is Already Implemented

### Frontend

- Startseite
- Angebotsliste mit Filtern
- Prospektseite
- Einkaufsliste
- Umschaltung `week=current|next`
- manueller Ingest per Button

### Backend / Data

- SQLite über `node:sqlite`
- interne APIs unter `app/api/*`
- Ingest-Architektur unter `lib/ingest/*`
- einheitliches Offer-Modell für Live- und Fixture-Daten

## Lidl Live Adapter

Datei:

- [lib/ingest/adapters/lidl.js](/Users/jiazheng/idol/claude_projects/supermarket_discount/lib/ingest/adapters/lidl.js)

### Aktuelle Datenquellen

1. Übersicht:
   `https://www.lidl.de/c/online-prospekte/s10005610`

2. Flyer-Details:
   `https://endpoints.leaflets.schwarz/v4/flyer?flyer_identifier=...`

### Was aus dem viewer endpoint bereits kommt

- flyer metadata
- gültige Woche
- PDF URL
- Produktobjekte
- Produktbild
- Produkt-URL
- Produktpreis
- Kategorien / Brand / Beschreibung

### Wichtige Entscheidung

Frühere Versuche, für Lidl zusätzlich Originalpreis und Rabatt zu ergänzen, wurden wieder entfernt.  
Grund: selbst auf offiziellen Seiten waren diese Felder in der Praxis nicht robust genug für einen sauberen MVP und führten zu Fehlwerten.

Der aktuelle Adapter macht deshalb absichtlich nur noch:

- Prospekt entdecken
- viewer API laden
- Produktdaten deduplizieren
- saubere Angebotsobjekte mit Bild + aktuellem Preis speichern

### Ergebnis aktuell

- Bilder funktionieren stabil
- Beschreibung wird mit `he` bereinigt
- aktueller Angebotspreis ist live
- keine alte Preislogik mehr im aktiven Datenpfad

Stand der letzten lokalen Verifikation:

- Lidl current week offers: `150`
- mit Bild: `150`

- Lidl next week offers: `126`
- mit Bild: `126`

## ALDI Live Adapter

Datei:

- [lib/ingest/adapters/aldi.js](/Users/jiazheng/idol/claude_projects/supermarket_discount/lib/ingest/adapters/aldi.js)

### Aktuelle Datenquellen

1. Prospekt-Übersicht:
   `https://www.aldi-sued.de/prospekte`

2. Primärer Produktpfad:
   `https://prospekt.aldi-sued.de/<slug>/data.json`
   plus
   `https://prospekt.aldi-sued.de/<slug>/page/{n}/hotspots_data.json?version=...`

3. HTML-Fallback:
   `https://www.aldi-sued.de/angebote/{validFrom}`

### Was aktuell live kommt

- Prospekt-Link für aktuelle Woche
- Prospekt-Link für nächste Woche
- Angebotsname
- Marke
- Preis
- Produktbild
- unitInfo aus Prospekt-Produktbeschreibung bzw. Produkttyp
- current/next week Auswahl

Stand der letzten lokalen Verifikation vom `2026-03-13`:

- ALDI current week offers: `183`
- mit Bild: `183`
- ALDI next week offers: `30`
- mit Bild: `30`

### Wichtige Entscheidung

Für ALDI ist der HTML-Tile-Ansatz nicht mehr die Primärquelle.  
Der aktuelle Adapter nutzt:

- `/prospekte` für current/next Prospekt-Erkennung
- den offiziellen Publitas-Prospekt für vollständige Produkt-Hotspots
- `/angebote/{date}` nur noch als Fallback

Grund: Die aktuelle ALDI-`/angebote/{date}`-Seite liefert für `current` nicht mehr stabil alle Produkte serverseitig gerendert. Die offiziellen Prospekt-Hotspots liefern dagegen vollständige Produktlisten inklusive Bilder.

## Important Constraints

### REWE

- direktes serverseitiges HTML-Fetching läuft in Cloudflare-Challenge
- deshalb noch kein echter Adapter

### Lidl

- viewer endpoint ist stabil genug für Metadaten, Produkte, Bilder und aktuelle Preise
- Produktdaten sind für den aktuellen MVP ausreichend
- current/next week Auswahl basiert auf dem offiziellen Prospekt-Überblick

### Kategorien

- gemeinsame Kategorien sind bereits vorhanden
- Lidl-spezifische Kategorien werden aktuell nur über einfache Textregeln gemappt
- manche Zuordnungen sind fachlich noch ungenau
- ALDI-Produkttypen aus den Prospekt-Hotspots werden aktuell noch nur grob gemappt

## Files Worth Reading First

- [lib/ingest/adapters/lidl.js](/Users/jiazheng/idol/claude_projects/supermarket_discount/lib/ingest/adapters/lidl.js)
- [lib/db.js](/Users/jiazheng/idol/claude_projects/supermarket_discount/lib/db.js)
- [app/offers/page.js](/Users/jiazheng/idol/claude_projects/supermarket_discount/app/offers/page.js)
- [components/offer-card.js](/Users/jiazheng/idol/claude_projects/supermarket_discount/components/offer-card.js)
- [lib/sample-data.js](/Users/jiazheng/idol/claude_projects/supermarket_discount/lib/sample-data.js)

## Known Gaps

1. ALDI-Kategorien sind noch ungenau, weil die offiziellen Prospekt-Produkttypen noch nicht sauber auf die gemeinsame Taxonomie gemappt werden.
2. Es gibt noch keine persistente Rohdatenablage für HTML/PDF Snapshots je Ingest-Lauf.
3. Es gibt noch kein Admin-UI für "needs review" oder manuelle Korrekturen.
4. Es gibt noch keine echte REWE-Live-Anbindung.
5. EDEKA `next` week ist nur live, wenn der gewählte Markt bereits offiziell einen zukünftigen Flyer veröffentlicht hat.

## Best Next Steps

1. ALDI-Kategorien verbessern.
2. Lidl-Kategorien verbessern.
3. Für EDEKA einen Markt mit früh veröffentlichtem next-week-Flyer finden und den `next`-Pfad gegen Live-Daten verifizieren.
4. Falls Originalpreis später wieder zurückkommen soll, komplett separat neu designen und nicht auf dem alten Codepfad wieder aufbauen.

## Practical Warning

Port `3000` war in dieser Session zeitweise von einer alten Instanz belegt. Für die aktuelle Entwicklungsarbeit wurde `3001` verwendet. Wenn UI-Verhalten nicht zu den letzten Codeänderungen passt, zuerst prüfen, ob wirklich `127.0.0.1:3001` geöffnet ist.
