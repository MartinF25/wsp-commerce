# n8n Workflow: Kleinanzeigen Market Scout

## Empfehlung: RSS-Workflow verwenden

**`wsp-market-scout-rss.json`** ist der empfohlene Produktions-Workflow.
Kostenlos, kein externer Dienst, kein API-Key nötig.

Apify ist eine Alternative für höheres Volumen (>25 Anzeigen pro Keyword/Tag),
kostet aber Geld. Für täglichen Scout-Betrieb reicht RSS vollständig aus.

---

## Ziel

Dieser Workflow scoutet täglich Kleinanzeigen.de nach gebrauchten Solarprodukten
(Speicher, Wechselrichter, Solarzaun etc.) und importiert die Ergebnisse über
die bestehende Bulk-Import-API in `market_listings`.

**Altersfilter:** Nur Anzeigen der letzten 3 Tage werden importiert.
Ältere Anzeigen sind häufig bereits verkauft – kein Import von "Leichen".

Die importierten Listings stehen danach automatisch dem Daily Report Agent
(`POST /api/admin/market-opportunities/daily-report`) und dem Availability
Batch Check zur Verfügung.

---

## Warum RSS die bessere Wahl ist

Kleinanzeigen.de betreibt offizielle RSS-Feeds für jede Suche:
```
https://www.kleinanzeigen.de/s-anzeigen/rss.html?keywords=Sungrow+SBR
```

Vorteile gegenüber Apify/Scraping:
- **Kostenlos** – kein Account, kein API-Key, kein Credit
- **Kein Bot-Block** – RSS ist für maschinellen Abruf gedacht
- **Strukturiert** – XML mit Titel, Link, Datum, Beschreibung
- **Chronologisch** – neueste Anzeigen zuerst, passt perfekt zum Altersfilter
- **Stabil** – offizielles Format, ändert sich selten

Einschränkung: RSS liefert ~20–25 neueste Anzeigen pro Suche.
Mit 3-Tage-Filter typischerweise 2–10 relevante Anzeigen pro Keyword.
Gesamtvolumen täglich: ~50–150 neue Listings über alle Keywords.

---

## Warum Apify eine Alternative bleibt

Kleinanzeigen.de nutzt Cloudflare-Schutz und blockt einfache HTTP-Requests
nach wenigen Aufrufen. Ein direkter `fetch()`-Aufruf scheitert in Produktion
zuverlässig an:

- Cloudflare CAPTCHA nach 2–5 Requests pro IP
- User-Agent-Filterung für bekannte Bot-User-Agents
- Rate-Limiting auf Suchseiten

Apify (`epctex/kleinanzeigen-scraper`) umgeht das durch:
- Proxy-Rotation (wechselnde Residential-IPs)
- Browser-Fingerprint-Simulation
- Automatische Paginierung
- Strukturierten Output (keine HTML-Parserei nötig)

**Kosten:** Apify bietet $5/Monat Free Tier. Ein täglicher Run mit
17 Keywords × 50 Ergebnissen = ~850 Requests liegt deutlich darunter.

---

## Warum direkter HTTP-Test nur MVP/Test ist

`wsp-market-scout-http-test.json` macht einen einfachen GET auf die
Kleinanzeigen-Suchseite und parst rohes HTML.

**Nicht für Produktion** weil:
- Wird nach wenigen Runs geblockt
- HTML-Struktur ändert sich ohne Ankündigung
- Kein Preis-Parsing bei JavaScript-gerenderten Elementen
- Nicht skalierbar auf mehrere Keywords

Nur zum lokalen Test der Bulk-Import-Pipeline ohne Apify-Account.

---

## Dateien

| Datei | Zweck | Empfehlung |
|---|---|---|
| `docs/n8n/workflows/wsp-market-scout-rss.json` | **Produktions-Workflow (RSS, kostenlos)** | **Empfohlen** |
| `docs/n8n/workflows/wsp-market-scout-apify.json` | Produktions-Workflow (Apify, kostenpflichtig) | Alternative |
| `docs/n8n/workflows/wsp-market-scout-http-test.json` | Test-Workflow (Pipeline-Test mit Mock-Daten) | Nur lokal |

---

## Import-Anleitung in n8n

### Lokales n8n

```bash
# n8n über Docker starten (bereits in docker-compose.yml konfiguriert)
docker-compose up -d

# n8n UI öffnen
http://localhost:5678
```

1. n8n öffnen → Workflows
2. Oben rechts: **Import from file**
3. Datei wählen: `wsp-market-scout-apify.json`
4. Workflow wird geöffnet
5. ENV-Variablen konfigurieren (siehe unten)
6. Workflow aktivieren

### Produktions-n8n

Gleicher Ablauf über die n8n-Instanz des Servers.

---

## Benötigte ENV-Variablen

In n8n unter **Settings → Environment Variables** setzen:

| Variable | Wert | Workflow |
|---|---|---|
| `COMMERCE_API_URL` | `https://commerce-api-production-614e.up.railway.app` | Alle |
| `ADMIN_SECRET` | `<aus apps/admin/.env.local>` | Alle |
| `APIFY_API_TOKEN` | `<aus Apify Dashboard>` | Nur Apify-Workflow |

**RSS-Workflow:** Nur `COMMERCE_API_URL` und `ADMIN_SECRET` nötig – beide bereits
für die anderen Market-Workflows gesetzt. Kein neuer Token erforderlich.

**Apify-Workflow:** Zusätzlich `APIFY_API_TOKEN` aus https://console.apify.com

---

## Aktivierung des Cron-Triggers

Der Workflow enthält zwei Trigger:
- **Manuell starten** – für Tests
- **Täglich 06:00** – automatisch

Cron ist im Workflow bereits auf `0 6 * * *` gesetzt.
Zum Aktivieren: Workflow öffnen → **Active**-Toggle oben rechts einschalten.

Die anderen Market-Workflows laufen um 10:00 (Verfügbarkeit) und 12:00
(Tagesbericht) – der Scout um 06:00 stellt sicher, dass neue Listings
rechtzeitig vor dem Tagesbericht vorhanden sind.

---

## Keyword-Konzept

### MVP: Statisch im Workflow

Die Keywords sind im **Code-Node "Keywords laden"** als Array hinterlegt.
Dort direkt bearbeiten.

### Kategorien und Priorität

| Kategorie | Priorität | Beispiel-Keywords |
|---|---|---|
| Solarspeicher | HOCH | Sungrow SBR, BYD HVS, Anker Solix |
| Solarzaun | HOCH | Solarzaun, PV Zaun, bifazial |
| Solaranlage+Speicher | MITTEL | Photovoltaik Komplettanlage Speicher |
| Wechselrichter | MITTEL | Sungrow Hybrid Wechselrichter |
| Balkonkraftwerk+Speicher | MITTEL | Balkonkraftwerk Speicher |
| SkyWind | NIEDRIG | (kein Keyword in MVP) |

### Späterer Ausbau: Keywords aus Google Sheets

Der Analyse-Bericht beschreibt einen `sheets-sync` n8n-Workflow, der
Referenzpreise aus Google Sheets synchronisiert. Keywords können analog
aus einem `keywords`-Sheet geladen werden:

```
GET {{ $env.COMMERCE_API_URL }}/api/admin/market-intelligence/keywords
→ gibt [{keyword, category, priority, active},...] zurück
```

Oder direkt aus dem Google Sheets Node (wie in `wsp-market-referenzpreise-sync.json`).

---

## Datenfluss RSS-Workflow (empfohlen)

```
[06:00 Cron] / [Manuell]
      │
      ▼
[Code: Keywords laden]
  → gibt 17 Items zurück, eines pro Keyword
  → jedes Item: { keyword, category, maxAgeDays: 3, rssUrl }
      │
      ▼ (17× – einmal pro Keyword)
[HTTP GET: RSS Feed laden]
  → GET https://www.kleinanzeigen.de/s-anzeigen/rss.html?keywords=Sungrow+SBR
  → gibt RSS-XML zurück (responseFormat: text)
      │
      ▼
[Code: RSS parsen + Altersfilter]
  → parst <item>-Elemente aus XML (kein externes Package)
  → SKIP: Anzeigen älter als 3 Tage (pubDate-Prüfung)
  → extrahiert adId aus Link-URL
  → extrahiert Preis aus Beschreibungstext
  → entfernt Duplikate (seen Set per adId)
  → baut { source, keyword, listings: [...] } Payload
      │
      ▼
[HTTP: Commerce Bulk Import]
  → POST {{ COMMERCE_API_URL }}/api/admin/market-listings/bulk
  → Header: X-Admin-Key
      │
      ▼
[IF: Erfolg?]
  → ok === true
      │              │
      ▼              ▼
[noOp: OK]    [noOp: Fehler]
```

## Datenfluss Apify-Workflow (Alternative)

```
[06:00 Cron] / [Manuell]
      │
      ▼
[Code: Keywords laden]
  → gibt 17 Items zurück, eines pro Keyword
  → jedes Item: { keyword, category }
      │
      ▼ (17× – einmal pro Keyword)
[HTTP: Apify Actor starten]
  → POST https://api.apify.com/v2/acts/epctex~kleinanzeigen-scraper/run-sync-get-dataset-items
  → Timeout 120s
  → gibt Kleinanzeigen-Listings als Array zurück
      │
      ▼
[Code: Normalisieren + adId + Duplikate]
  → extrahiert adId aus URL
  → mappt Apify-Felder auf Bulk-API-Format
  → entfernt Duplikate innerhalb des Keywords
  → baut { source, keyword, listings: [...] } Payload
      │
      ▼
[HTTP: Commerce Bulk Import]
  → POST {{ COMMERCE_API_URL }}/api/admin/market-listings/bulk
  → Header: X-Admin-Key
      │
      ▼
[IF: Erfolg?]
  → ok === true
      │              │
      ▼              ▼
[noOp: OK]    [noOp: Fehler]
```

---

## Bulk API Payload

**Endpoint:** `POST /api/admin/market-listings/bulk`

**Headers:**
```
X-Admin-Key: {{ $env.ADMIN_SECRET }}
Content-Type: application/json
```

**Body:**
```json
{
  "source": "kleinanzeigen",
  "keyword": "Sungrow SBR",
  "listings": [
    {
      "adId": "3409646684",
      "title": "Sungrow SBR Speicher 9.6 kWh",
      "price": "1.500 € VB",
      "description": "Guter Zustand, kaum benutzt",
      "location": "Frankfurt am Main",
      "plz": "60311",
      "date": "Heute, 07:17",
      "url": "https://www.kleinanzeigen.de/s-anzeige/...",
      "image": "https://img.kleinanzeigen.de/...",
      "shipping": "Versand möglich"
    }
  ]
}
```

**Achtung:** Die Felder heißen `url` und `image` (nicht `listingUrl`/`imageUrl`).
Das ist der exakte Feldname aus dem TypeScript-Interface der Bulk-Route.

**Response:**
```json
{ "ok": true, "upserted": 12, "skipped": 2 }
```

---

## Datenmapping Apify → Bulk API

| Apify Output-Feld | Bulk API Feld | Transformation |
|---|---|---|
| `url` / `link` / `href` | `url` | Direkt |
| URL-Pattern `/(\d{7,12})/` | `adId` | Regex-Extraktion |
| `title` / `name` | `title` | Direkt, getrimmt |
| `price` / `priceText` / `priceRaw` | `price` | Rohtext, z.B. `"1.500 € VB"` |
| `description` / `text` | `description` | Optional, max 2000 Zeichen |
| `location` / `address` / `city` | `location` | Direkt |
| `zip` / `zipCode` / `postalCode` / `plz` | `plz` | Direkt |
| `images[0]` / `image` / `imageUrl` | `image` | Erstes Bild |
| `shipping` | `shipping` | Optional |
| `date` / `createdAt` / `listedAt` | `date` | Rohformat, Backend parst |
| *(aus Workflow-Kontext)* | `keyword` | Aus Keywords-Node |

Die adId-Extraktion aus der URL:
```javascript
// URL: https://www.kleinanzeigen.de/s-anzeige/sungrow-sbr/3409646684-168-1234
const match = url.match(/\/(\d{7,12})(?:-\d+-\d+)?(?:[/?#]|$)/);
const adId = match ? match[1] : null;
```

---

## Testanleitung

### Schritt 1: Lokalen Test mit HTTP-Test-Workflow

```
1. n8n öffnen: http://localhost:5678
2. wsp-market-scout-http-test.json importieren
3. Manuell ausführen
4. Ergebnis: Sieht die Normalisierung OK aus?
5. Check in Admin: http://localhost:3000/market
```

### Schritt 2: Apify-Workflow mit einem Keyword testen

```
1. wsp-market-scout-apify.json importieren
2. Im Code-Node "Keywords laden" alle Keywords außer einem auskommentieren
3. Manuell ausführen
4. Apify Dashboard prüfen: wurde Actor gestartet?
5. n8n Execution Log prüfen: wurden Listings importiert?
6. Admin /market prüfen: erscheinen die neuen Listings?
```

### Schritt 3: Vollständigen Run mit allen Keywords testen

```
1. Keywords im Code-Node wieder aktivieren
2. Manuell ausführen
3. Erwartung: ~200–500 Listings je nach Keyword-Verfügbarkeit
4. Danach Daily Report Agent manuell starten
```

---

## Fehlerfälle

| Fehler | Ursache | Lösung |
|---|---|---|
| HTTP 401 auf `/bulk` | ADMIN_SECRET falsch | In n8n ENV prüfen |
| HTTP 422 auf `/bulk` | Body-Format falsch | Normalize-Code prüfen |
| Apify HTTP 401 | APIFY_API_TOKEN fehlt/ungültig | In n8n ENV setzen |
| Apify Timeout (>120s) | Keyword zu generisch, zu viele Ergebnisse | maxItems reduzieren |
| `adId` immer null | URL-Format von Kleinanzeigen geändert | Regex in Normalize-Node anpassen |
| 0 Listings importiert | Apify-Response-Format geändert | Response-Struktur im Log prüfen |
| Alle Listings `skipped` | `adId` fehlt oder `title` fehlt | Mapping prüfen |

---

## Rate-Limit-Hinweise

- Apify übernimmt die Rate-Limitierung (Proxy-Rotation)
- Maximal 50 Ergebnisse pro Keyword (konfigurierbar in Keywords-Node)
- 17 Keywords × 50 = max. 850 Listings pro Tages-Run
- Apify Free Tier: ~5 USD/Monat gratis, reicht für dieses Volumen
- Commerce-API hat kein explizites Rate-Limit, aber bei >1000 Listings pro Request
  empfiehlt sich Aufteilung in mehrere Bulk-Calls

---

## Bekannte Grenzen

1. **Apify-Actor-Felder können sich ändern** – Bei einem Major-Update des Actors
   muss der Normalize-Code eventuell angepasst werden. Der Code ist defensiv
   geschrieben und prüft mehrere mögliche Feldnamen.

2. **Nur Kleinanzeigen** – eBay Kleinanzeigen (jetzt `kleinanzeigen.de`) ist die
   einzige Quelle. Andere Quellen (eBay.de, Willhaben, Facebook Marketplace)
   würden separate Workflows benötigen.

3. **Keine Beschreibung bei kurzen Listings** – Manche Kleinanzeigen haben keine
   Beschreibung. Das Feld ist optional und wird übersprungen.

4. **PLZ nicht immer verfügbar** – Apify liefert PLZ nur wenn auf der Anzeige
   sichtbar. `plz: null` ist normal.

5. **Preis nicht immer vorhanden** – VB-Anzeigen ohne Preisangabe haben
   `price: null` in der DB (`price_cents = null`).

---

## Nächster sinnvoller Ausbau

### A: Keywords aus Google Sheets
Analog zu `wsp-market-referenzpreise-sync.json`: Google Sheets Node liest
`keywords`-Sheet, übergibt Keyword-Liste an Scout.

### B: Keywords aus Commerce API
Neuer Endpunkt `GET /api/admin/market-intelligence/keywords` liefert
Admin-pflegbare Keyword-Liste direkt aus der Datenbank.

### C: Telegram/Mail Alert bei Fehler
Apify-Fehler oder Bulk-Import-Fehler → Telegram-Bot oder Gmail-Node
sendet Alert. Pattern aus `n8n-affiliate-health-check.md` übernehmen.

### D: Automatische Übergabe an Daily Report
Nach erfolgreichem Bulk-Import → automatisch Daily Report Agent triggern.
Derzeit: Tagesbericht läuft 6 Stunden nach Scout (12:00). Bei manuellen
Runs: Tagesbericht separat manuell starten.

### E: Zweite Quelle: eBay.de
Apify hat auch einen eBay-Scraper. Separater Workflow mit eigenem
keyword-Mapping für eBay-spezifische Suchbegriffe.

---

## Umgebungsvariablen – Zusammenfassung

```bash
# In n8n UI: Settings → Environment Variables

COMMERCE_API_URL=https://commerce-api-production-614e.up.railway.app
# Bereits gesetzt für andere Market-Workflows

ADMIN_SECRET=<wert aus apps/admin/.env.local>
# Bereits gesetzt für andere Market-Workflows

APIFY_API_TOKEN=<token aus https://console.apify.com/account/integrations>
# NEU – muss einmalig gesetzt werden
```

---

*Erstellt: Juni 2026 – WSP Commerce Intelligence Phase 3*
