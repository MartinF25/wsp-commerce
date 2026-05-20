# Affiliate-Produkt-Import

## Übersicht

Affiliate-Produkte können lokal per JSON- oder CSV-Datei importiert werden.
Das Import-Skript validiert die Daten, führt Upserts anhand des `slug` durch
und unterstützt einen `--dry-run`-Modus ohne DB-Schreibvorgänge.

## Pflichtfelder

| Feld | Beschreibung |
|------|-------------|
| `slug` | URL-sicherer Bezeichner, eindeutig, z. B. `balkonkraftwerk-600w` |
| `status` | `draft` / `active` / `archived` |
| `category_slug` | Muss in der DB existieren oder im Import enthalten sein |
| `product_type` | Für Affiliate-Produkte: `affiliate_external` |
| `affiliate_provider` | Im MVP nur `amazon` |
| `affiliate_url` | Gültige HTTPS-URL mit Partner-Tag, z. B. `?tag=XXXXX-21` |
| `title_de` | Pflicht-Übersetzung Deutsch |
| `short_description_de` | Kurzbeschreibung Deutsch |

## Optionale Felder

| Feld | Beschreibung |
|------|-------------|
| `affiliate_enabled` | `true` / `false`. Standard: automatisch `true` wenn `affiliate_url` gesetzt |
| `affiliate_asin` | Amazon-ASIN, Format: `B` + 9 alphanumerische Zeichen |
| `affiliate_button_label` | Eigener Button-Text. Standard: Übersetzung `affiliate_cta` |
| `affiliate_disclosure` | Eigener Hinweistext. Standard: Übersetzung `affiliate_disclosure` |
| `image_url` | Öffentliche Bild-URL (eigene Bilder, keine Amazon-Bilder) |
| `image_alt` | Alt-Text für das Bild |
| `title_en`, `short_description_en`, … | Englische Übersetzung (optional) |
| `title_es`, `short_description_es`, … | Spanische Übersetzung (optional) |

## Beispiel-Datei vorbereiten

1. `examples/affiliate-products.json` oder `examples/affiliate-products.csv` kopieren
2. `BPLATZHALTER` durch echte ASIN ersetzen
3. `PARTNER-TAG-21` durch eigenen Amazon-Partner-Tag ersetzen
4. Texte (title, description, features) mit eigenen Inhalten befüllen
5. Eigenes Produktbild-URL eintragen (kein Amazon-Bild)
6. Keine Amazon-Preise, keine Amazon-Bewertungen übernehmen

## Dry-run ausführen

```bash
# JSON
pnpm --filter commerce exec ts-node prisma/import-products.ts import/examples/affiliate-products.json --dry-run

# CSV (nach Konvertierung zu JSON oder direkt per CSV-Flag, sobald implementiert)
```

Der Dry-run zeigt:
- Anzahl Produkte (gesamt, davon Affiliate)
- Übersetzungsverteilung (DE/EN/ES)
- Validierungsfehler ohne DB-Schreibvorgang

## Echten Import ausführen

```bash
pnpm --filter commerce exec ts-node prisma/import-products.ts import/examples/affiliate-products.json
```

Schreibt in die DB:
- Kategorie-Upsert (falls im Import enthalten)
- Produkt-Upsert anhand `slug`
- Übersetzungs-Upsert (DE/EN/ES)
- Bild-Ersatz (deleteMany + createMany)

## Produkt danach prüfen

1. Admin → Produkte → neues Produkt suchen
2. Storefront → `/products/[slug]` aufrufen
3. Affiliate-Button prüfen (Amazon-Link, `rel="sponsored nofollow noopener noreferrer"`)
4. Partnerlink-Badge prüfen (Produktkarte)
5. Datenschutz-Hinweis prüfen

## Affiliate-Link später bearbeiten

Im Admin unter Produkte → Produkt auswählen → Tab "Affiliate":
- `affiliate_url` bearbeiten
- `affiliate_enabled` umschalten
- `affiliate_button_label` anpassen
- `affiliate_disclosure` anpassen

Alternativ erneuten Import mit aktualisiertem JSON/CSV durchführen (Upsert).

## Klicktracking

Beim Klick auf den Affiliate-Button sendet der Browser automatisch
ein anonymes Tracking-Event an `/api/affiliate/track`.

### Gespeicherte Daten

| Feld | Beschreibung |
|------|-------------|
| `product_id` | ID des Affiliate-Produkts |
| `clicked_at` | Zeitstempel (DB-Default) |
| `referrer_path` | Pfad der Quellseite |
| `locale` | Sprachversion (de/en/es) |
| `source` | Klickquelle: `product_detail` / `product_card` / `solution_page` / `blog` / `unknown` |
| `affiliate_provider` | z. B. `amazon` |
| `device_category` | `mobile` / `desktop` / `tablet` (kein Raw-User-Agent) |

### Bewusst NICHT gespeichert

- IP-Adresse
- Vollständiger User-Agent-String
- Cookies oder sonstige Identifikatoren
- Personenbezogene Daten jeglicher Art

## Klickstatistiken im Admin

Admin → Affiliate-Statistiken

Zeigt:
- Klicks pro Produkt (7 Tage / 30 Tage / gesamt)
- Letzter Klick
- Klicks nach Quelle und Sprache
- CSV-Export

## No-Gos

- Keine Amazon-Bilder ohne Rechte
- Keine Amazon-Preise als eigene Preise eintragen
- Keine Amazon-Bewertungen übernehmen
- Keine Amazon-Produktseiten scrapen
- Kein Partner-Tag vergessen (sonst keine Provision)
- Kein `affiliate_external`-Produkt ohne `affiliate_url`
