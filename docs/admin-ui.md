



# Admin UI

Die Admin-App ist ein schlichtes internes UI fuer Katalogpflege. Sie verwaltet Kategorien, Produkte, Varianten, Preise und Bild-URLs. Sie enthaelt keine Checkout-, Lead- oder Storefront-Logik.

## Schutz

Die App ist per HTTP Basic Auth geschuetzt. Ohne `ADMIN_SECRET` antwortet sie mit `503` und ist geschlossen.

Login:

- Benutzername: `admin`
- Passwort: Wert von `ADMIN_SECRET`

Beispiel `apps/admin/.env.local`:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/wsp_commerce
ADMIN_SECRET=change-me
```

## Start

Aus `apps/admin`:

```bash
npm run dev
```

Die App laeuft standardmaessig auf:

```text
http://localhost:3002
```

## Kategorien Pflegen

1. `/categories` oeffnen.
2. `+ Neue Kategorie` klicken.
3. Name eintragen; Slug kann leer bleiben und wird dann generiert.
4. Optional Beschreibung, Elternkategorie und Aktiv-Status setzen.
5. Speichern.

Aktivieren/deaktivieren erfolgt ueber die Bearbeitungsseite der Kategorie mit dem Feld `Aktiv`.

## Produkte Pflegen

1. `/products` oeffnen.
2. `+ Neues Produkt` klicken.
3. Name, Kurzbeschreibung, Beschreibung und optional Produktpflege-/SEO-Felder setzen.
4. Kategorie zuweisen.
5. `product_type` waehlen: `direct_purchase`, `configurable`, `inquiry_only`.
6. Status waehlen: `draft`, `active`, `archived`.
7. Speichern.

Ein Produkt wird veroeffentlicht, indem sein Status auf `active` gesetzt wird.

## Varianten Preise Bilder

Nach dem Anlegen eines Produkts auf der Bearbeitungsseite:

- Varianten: SKU, Name, Preis, Waehrung, Lagerbestand, Attribute, Gewicht und Abmessungen pflegen.
- Preis: als Dezimalwert eingeben, z. B. `1299,00`; gespeichert wird `price_cents`.
- Bilder: URL, Alt-Text und Reihenfolge pflegen.

`priceDisplay` wird nicht manuell gepflegt. Es wird im Commerce-Service aus Produkttyp und Variantenpreisen berechnet.
