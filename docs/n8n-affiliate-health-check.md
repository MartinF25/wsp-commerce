# n8n Workflow: Affiliate Health-Check

## Übersicht

Dieser Workflow prüft regelmäßig alle aktiven Affiliate-Produkte auf Konsistenz und
Link-Erreichbarkeit – ohne Amazon-Scraping, ohne Preise, ohne PII.

---

## Workflow: `affiliate-health-check`

### Trigger

- **Typ:** Schedule (Cron)
- **Zeitplan:** `0 3 * * *` (täglich 03:00 Uhr, außerhalb der Primetime)

### Was geprüft wird

| Check | Methode | Ergebnis-Status |
|---|---|---|
| affiliate_url fehlt | Feldprüfung | `missing` |
| URL kein HTTPS | Feldprüfung | `invalid_url` |
| Aktives Produkt + enabled=true + kein Link | Feldprüfung | `missing` |
| DE-Translation fehlt | DB-Prüfung | Warnung |
| Bild fehlt | DB-Prüfung | Warnung |
| Kategorie fehlt | DB-Prüfung | Warnung |
| HTTP HEAD Timeout (>5s) | HTTP-Request | `timeout` |
| HTTP HEAD 4xx/5xx | HTTP-Request | `error` |
| HTTP HEAD 200/301/302 | HTTP-Request | `ok` |
| HTTP HEAD 403/405 (Amazon) | HTTP-Request | `blocked` |

### Was NICHT geprüft wird

- Preise auf Amazon
- Bilder von Amazon-CDN
- Bewertungen oder Ratings
- Produktverfügbarkeit auf Amazon
- Kein Scraping, kein HTML-Parsing

---

### Nodes

#### 1. `Cron Trigger`
```
Schedule: 0 3 * * *
Timezone: Europe/Berlin
```

#### 2. `HTTP Request: Alle aktiven Affiliate-Produkte laden`
```
Method: GET
URL:    {{ $env.COMMERCE_API_URL }}/api/admin/products?type=affiliate_external&status=active
Headers:
  X-Admin-Key: {{ $env.ADMIN_SECRET }}
```

#### 3. `Code: Produkte aufbereiten`
```javascript
const products = $input.first().json.data;
return products.map(p => ({ json: p }));
```

#### 4. `Code: Feld-Validierung`
```javascript
const product = $input.first().json;
const issues = [];

// Pflicht-Checks
if (!product.affiliate_url) {
  return [{ json: { product, status: 'missing', message: 'affiliate_url fehlt', issues } }];
}
if (!product.affiliate_url.startsWith('https://')) {
  return [{ json: { product, status: 'invalid_url', message: 'affiliate_url ist kein HTTPS', issues } }];
}

// Warnungen
if (!product.translations?.find(t => t.locale === 'de')?.name) {
  issues.push('DE-Titel fehlt');
}
if (!product.images?.length) {
  issues.push('Kein Bild gesetzt');
}
if (!product.category_id) {
  issues.push('Keine Kategorie zugewiesen');
}

return [{ json: { product, status: null, message: null, issues, url: product.affiliate_url } }];
```

#### 5. `IF: URL vorhanden und gültig?`
```
Condition: {{ $json.status }} === null
  → TRUE:  Link-Check Branch
  → FALSE: Health-Status direkt setzen (missing/invalid_url)
```

**Link-Check Branch:**

#### 6a. `HTTP Request: HEAD-Request`
```
Method: HEAD
URL:    {{ $json.url }}
Timeout: 5000ms
Ignore SSL Errors: false
Redirect: Follow (max 3)
Response: Ignore Body
```

#### 6b. `Code: HTTP-Status auswerten`
```javascript
const httpStatus = $input.first().json.statusCode || 0;
const product = $('Code: Feld-Validierung').first().json.product;
const issues = $('Code: Feld-Validierung').first().json.issues;

let status, message;
if ([200, 301, 302, 303].includes(httpStatus)) {
  status = 'ok';
  message = `HEAD ${httpStatus}`;
} else if ([403, 405].includes(httpStatus)) {
  // Typisches Amazon-Verhalten: HEAD nicht erlaubt
  status = 'blocked';
  message = `HEAD ${httpStatus} (erwartet bei Amazon)`;
} else if (httpStatus >= 400) {
  status = 'error';
  message = `HEAD ${httpStatus}`;
} else {
  status = 'error';
  message = `Unbekannter Status: ${httpStatus}`;
}

return [{ json: { product, status, message, issues } }];
```

#### 6c. *(Bei Timeout)* `Code: Timeout verarbeiten`
```javascript
const product = $('Code: Feld-Validierung').first().json.product;
const issues = $('Code: Feld-Validierung').first().json.issues;
return [{ json: { product, status: 'timeout', message: 'HEAD-Request Timeout (>5s)', issues } }];
```

#### 7. `HTTP Request: Health-Status updaten`
```
Method: PATCH
URL:    {{ $env.COMMERCE_API_URL }}/api/admin/products/{{ $json.product.id }}/affiliate-health
Headers:
  X-Admin-Key: {{ $env.ADMIN_SECRET }}
  Content-Type: application/json
Body:
  {
    "status": "{{ $json.status }}",
    "message": "{{ $json.message }}"
  }
```

#### 8. `Code: Alle Ergebnisse sammeln` *(nach Loop über alle Produkte)*
```javascript
const allResults = $input.all().map(i => i.json);
const problems = allResults.filter(r => r.status !== 'ok' && r.status !== 'blocked');
const warnings = allResults.flatMap(r => r.issues || []);
const summary = {
  total: allResults.length,
  ok: allResults.filter(r => r.status === 'ok').length,
  blocked: allResults.filter(r => r.status === 'blocked').length,
  timeout: allResults.filter(r => r.status === 'timeout').length,
  error: allResults.filter(r => r.status === 'error').length,
  missing: allResults.filter(r => r.status === 'missing').length,
  invalid_url: allResults.filter(r => r.status === 'invalid_url').length,
  warnings: warnings.length,
  problems,
};
return [{ json: summary }];
```

#### 9. `IF: Probleme vorhanden?`
```
Condition: {{ $json.problems.length }} > 0 OR {{ $json.warnings }} > 0
```

#### 10. `Code: Report formatieren`
```javascript
const s = $input.first().json;

const lines = [
  `=== Affiliate Health-Check Report ===`,
  `Datum: ${new Date().toLocaleString('de-DE')}`,
  `Geprüft: ${s.total} Produkte`,
  ``,
  `STATUS-ÜBERSICHT`,
  `  ok:          ${s.ok}`,
  `  blocked:     ${s.blocked}  (Amazon HEAD 405 – normal)`,
  `  timeout:     ${s.timeout}`,
  `  error:       ${s.error}`,
  `  missing:     ${s.missing}`,
  `  invalid_url: ${s.invalid_url}`,
  `  Warnungen:   ${s.warnings}`,
];

if (s.problems.length > 0) {
  lines.push(``, `PROBLEME (Handlungsbedarf):`);
  for (const p of s.problems) {
    lines.push(`  ${p.product.slug}: ${p.status} – ${p.message}`);
  }
}

return [{ json: { subject: `Affiliate Health-Check: ${s.problems.length} Probleme`, body: lines.join('\n') } }];
```

#### 11. `Gmail: Health-Report senden`
```
To:      {{ $env.ADMIN_EMAIL }}
Subject: {{ $json.subject }}
Body:    {{ $json.body }}
```

---

## Health-Status Bedeutung

| Status | Bedeutung | Handlungsbedarf |
|---|---|---|
| `ok` | Link erreichbar (HTTP 200/301/302) | Nein |
| `blocked` | HTTP 403/405 – typisch für Amazon | Nein (normal) |
| `timeout` | Request nach 5s abgebrochen | Link prüfen |
| `error` | HTTP 4xx/5xx | Link prüfen / Produkt archivieren |
| `missing` | affiliate_url fehlt | URL nachtragen |
| `invalid_url` | Kein HTTPS oder ungültiges Format | URL korrigieren |

---

## Umgebungsvariablen

| Variable | Beschreibung |
|---|---|
| `COMMERCE_API_URL` | Base-URL der Commerce-API |
| `ADMIN_SECRET` | Admin-API-Key |
| `ADMIN_EMAIL` | E-Mail für Health-Reports |

---

## Abgrenzung / Regeln

- **Kein Amazon-Scraping** – HEAD-Requests prüfen nur HTTP-Erreichbarkeit
- **Keine Preisabfragen** – Amazon-Preise werden nicht ausgewertet
- **Keine Bilder von Amazon** – eigene Bild-URLs im Shop bleiben unberührt
- **Keine Bewertungen** – kein Rating-Parsing
- `blocked` (HTTP 405) bei Amazon ist **kein Fehler** – Amazon erlaubt HEAD nicht
