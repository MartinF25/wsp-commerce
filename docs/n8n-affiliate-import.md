# n8n Workflow: Affiliate-Produkt-Import

## Übersicht

Dieser Workflow importiert Affiliate-Produkte aus einem Google Sheet in die Commerce-API.
Er läuft täglich automatisch und kann auch manuell getriggert werden.

---

## Workflow: `affiliate-product-import`

### Trigger

- **Typ:** Schedule (Cron)
- **Zeitplan:** `0 6 * * *` (täglich 06:00 Uhr)

### Nodes

#### 1. `Cron Trigger`
```
Schedule: 0 6 * * *
Timezone: Europe/Berlin
```

#### 2. `Google Sheets: Read Rows`
```
Operation: Read All Rows
Sheet ID:  <GOOGLE_SHEET_ID>
Sheet Name: Affiliate Produkte
Range:     A:AZ (alle Spalten)
First Row as Header: true
```

**Erwartete Spalten im Sheet (identisch mit CSV-Schema):**
```
slug | status | category_slug | sales_channel | affiliate_provider |
affiliate_url | affiliate_enabled | affiliate_asin | affiliate_button_label |
affiliate_disclosure | image_url | image_alt | sort_order | featured |
title_de | short_description_de | description_de | meta_title_de | meta_description_de |
title_en | short_description_en | description_en | meta_title_en | meta_description_en |
title_es | short_description_es | description_es | meta_title_es | meta_description_es |
import_status | import_date | import_message
```

> Spalten `import_status`, `import_date`, `import_message` werden von n8n zurückgeschrieben.

#### 3. `Code: Normalize Rows`
```javascript
const rows = $input.all();
const products = rows
  .filter(item => item.json.slug && item.json.slug.trim() !== '')
  .map(item => {
    const row = item.json;
    return {
      slug: row.slug?.trim(),
      status: row.status?.trim() || 'draft',
      category_slug: row.category_slug?.trim(),
      sales_channel: 'affiliate_external',
      affiliate_provider: row.affiliate_provider?.trim(),
      affiliate_url: row.affiliate_url?.trim(),
      affiliate_enabled: ['true','1','ja','yes'].includes(String(row.affiliate_enabled).toLowerCase()),
      affiliate_asin: row.affiliate_asin?.trim() || null,
      affiliate_button_label: row.affiliate_button_label?.trim() || null,
      affiliate_disclosure: row.affiliate_disclosure?.trim() || null,
      image_url: row.image_url?.trim() || null,
      image_alt: row.image_alt?.trim() || null,
      sort_order: parseInt(row.sort_order || '0') || 0,
      featured: ['true','1','ja','yes'].includes(String(row.featured).toLowerCase()),
      title_de: row.title_de?.trim(),
      short_description_de: row.short_description_de?.trim() || null,
      description_de: row.description_de?.trim() || null,
      meta_title_de: row.meta_title_de?.trim() || null,
      meta_description_de: row.meta_description_de?.trim() || null,
      title_en: row.title_en?.trim() || null,
      short_description_en: row.short_description_en?.trim() || null,
      description_en: row.description_en?.trim() || null,
      meta_title_en: row.meta_title_en?.trim() || null,
      meta_description_en: row.meta_description_en?.trim() || null,
      title_es: row.title_es?.trim() || null,
      short_description_es: row.short_description_es?.trim() || null,
      description_es: row.description_es?.trim() || null,
      meta_title_es: row.meta_title_es?.trim() || null,
      meta_description_es: row.meta_description_es?.trim() || null,
    };
  });

return [{ json: { products } }];
```

#### 4. `HTTP Request: Dry-Run`
```
Method: POST
URL:    {{ $env.COMMERCE_API_URL }}/api/admin/import/affiliate-products
Headers:
  X-Admin-Key: {{ $env.ADMIN_SECRET }}
  Content-Type: application/json
Body:
  {
    "mode": "dry_run",
    "products": {{ $json.products }}
  }
```

#### 5. `IF: Errors vorhanden?`
```
Condition: {{ $json.summary.errors }} > 0
  → TRUE:  Fehler-Branch
  → FALSE: Commit-Branch
```

**Fehler-Branch:**

#### 6a. `Code: Format Error Report`
```javascript
const result = $input.first().json;
const errors = result.issues?.filter(i => i.level === 'error') || [];
const warnings = result.issues?.filter(i => i.level === 'warning') || [];

const lines = [
  `=== Affiliate-Import FEHLER ===`,
  `Datum: ${new Date().toLocaleString('de-DE')}`,
  ``,
  `Geprüft: ${result.summary.total}`,
  `Fehler: ${result.summary.errors}`,
  `Warnungen: ${result.summary.warnings}`,
  ``,
  `--- FEHLER ---`,
  ...errors.map(e => `Zeile ${e.row} [${e.slug}] ${e.field}: ${e.message}`),
  ``,
  `→ Import nicht ausgeführt. Fehler im Sheet korrigieren.`
];

return [{ json: { subject: 'Affiliate-Import: Fehler gefunden', body: lines.join('\n') } }];
```

#### 6b. `Gmail: Fehler-Bericht senden`
```
To:      {{ $env.ADMIN_EMAIL }}
Subject: {{ $json.subject }}
Body:    {{ $json.body }}
```

#### 6c. `Google Sheets: Status zurückschreiben (Fehler)`
```
Operation: Update Rows
Spalte import_status: FEHLER
Spalte import_date:   {{ now }}
Spalte import_message: {{ $json.body }}
```

**Erfolgs-Branch:**

#### 6d. `HTTP Request: Commit`
```
Method: POST
URL:    {{ $env.COMMERCE_API_URL }}/api/admin/import/affiliate-products
Headers:
  X-Admin-Key: {{ $env.ADMIN_SECRET }}
  Content-Type: application/json
Body:
  {
    "mode": "commit",
    "products": {{ $('Code: Normalize Rows').first().json.products }}
  }
```

#### 6e. `Code: Format Success Report`
```javascript
const result = $input.first().json;
return [{
  json: {
    subject: `Affiliate-Import: ${result.summary.created} neu, ${result.summary.updated} aktualisiert`,
    body: [
      `=== Affiliate-Import erfolgreich ===`,
      `Datum: ${new Date().toLocaleString('de-DE')}`,
      ``,
      `Erstellt:      ${result.summary.created}`,
      `Aktualisiert:  ${result.summary.updated}`,
      `Übersprungen:  ${result.summary.skipped}`,
    ].join('\n'),
    statusText: `IMPORTIERT ${new Date().toLocaleDateString('de-DE')}`
  }
}];
```

#### 6f. `Google Sheets: Status zurückschreiben (Erfolg)`
```
Spalte import_status: IMPORTIERT YYYY-MM-DD
Spalte import_date:   {{ now }}
Spalte import_message: OK
```

#### 6g. `Gmail: Erfolgs-Bericht senden` *(optional)*
```
To:      {{ $env.ADMIN_EMAIL }}
Subject: {{ $json.subject }}
Body:    {{ $json.body }}
```

---

## Umgebungsvariablen

| Variable | Beschreibung |
|---|---|
| `COMMERCE_API_URL` | Base-URL der Commerce-API (z.B. `https://api.solarwind.example.com`) |
| `ADMIN_SECRET` | Admin-API-Key (entspricht `ADMIN_SECRET` in der Commerce-API) |
| `ADMIN_EMAIL` | E-Mail für Import-Reports |

---

## Regeln

- Leere Zeilen im Sheet (kein `slug`) werden übersprungen
- Nur eigene, manuell gepflegte Daten importieren
- Kein Scraping von Amazon oder anderen externen Quellen
- Keine Preise, Bilder oder Bewertungen von Amazon übernehmen
