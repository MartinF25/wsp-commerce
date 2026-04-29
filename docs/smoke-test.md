# End-to-End Staging Smoke-Test

Konsolidierte Checkliste für alle drei Staging-Dienste: Railway (Commerce API) + Firebase (onLeadSubmit) + Vercel (Storefront).  
Alle Checks auf der **Vercel Preview-URL** durchführen, außer wenn explizit anders angegeben.

---

## 0. Voraussetzungen prüfen

Bevor der Test beginnt, alle drei Services verifizieren:

```bash
# 1. Commerce API (Railway)
curl https://<railway-url>/health
# Erwartet: {"status":"ok","service":"commerce","ts":"..."}

# 2. Produkte vorhanden?
curl https://<railway-url>/api/catalog/products
# Erwartet: {"data":[...],"meta":{"total":3,...}}
# Wenn total=0: db:seed vergessen → railway run pnpm --filter commerce run db:seed

# 3. Firebase Function
curl -X POST https://europe-west1-wsp-commerce.cloudfunctions.net/onLeadSubmit \
  -H "Content-Type: application/json" \
  -d '{"type":"lead","leadType":"private","firstName":"Test","lastName":"User","company":null,"email":"smoke@test.com","phone":null,"message":"Smoke test","productInterest":"solarzaun","region":null,"submittedAt":"2026-04-29T10:00:00Z"}'
# Erwartet: {"success":true,"leadId":"<uuid>"}
```

Erst wenn alle drei grün → Storefront Smoke-Test starten.

---

## 1. Navigation & Pflichtseiten

| Seite | URL | Was prüfen |
|---|---|---|
| Homepage | `/` | Hero-Bild lädt, Produktkacheln sichtbar (oder leerer Zustand), CTAs klickbar |
| Solarzaun | `/solarzaun` | Seite öffnet, Hero, CTA vorhanden |
| SkyWind | `/skywind` | Seite öffnet, Hero, CTA vorhanden |
| Kombilösungen | `/kombiloesungen` | Seite öffnet, Hero, CTA vorhanden |
| Privatkunden | `/privatkunden` | Seite öffnet, kein 404 |
| Gewerbe & B2B | `/gewerbe-b2b` | Seite öffnet, kein 404 |
| Blog | `/blog` | Seite öffnet (ggf. leer wenn keine Blog-Posts) |
| FAQ | `/faq` | Seite öffnet, Fragen aufklappbar |
| Kontakt | `/kontakt` | Seite öffnet, Formular sichtbar |
| Impressum | `/impressum` | Seite öffnet, echte Unternehmensdaten sichtbar |
| Datenschutz | `/datenschutz` | Seite öffnet, vollständiger Text |

**Pflicht:** Alle Seiten müssen ohne 500-Fehler oder weiße Seite laden.

---

## 2. Produktkatalog (Commerce API → Storefront)

| Check | Erwartung |
|---|---|
| `/products` öffnet | Produktliste lädt mit min. 3 Produkten |
| Produktkarte zeigt Bild | Fallback-Bild oder echtes Bild (kein broken image icon) |
| Produktkarte zeigt Preis | z. B. "ab 1.299 €" oder "Preis auf Anfrage" |
| Produktdetailseite `/products/<slug>` öffnet | Vollständige Detailseite ohne 500 |
| Produktdetail: Varianten sichtbar | Variantenliste / Variantenauswahl dargestellt |
| `purchasable=true` Produkt | Kaufen-Button oder PayPal-Option sichtbar |
| `inquiry_only` Produkt | "Beratung anfragen"-Button statt Kaufen |

**Wenn Produktliste leer:** Commerce API antwortet, aber keine aktiven Produkte → `db:seed` erneut ausführen oder Produktstatus in Admin-API auf `active` setzen.

---

## 3. Sprachumschaltung (next-intl)

| Check | Erwartung |
|---|---|
| DE (Standard) | URL ohne Sprachpräfix: `/` → Deutsch |
| EN | URL mit Präfix: `/en` → Englisch, alle Texte englisch |
| ES | URL mit Präfix: `/es` → Spanisch, alle Texte spanisch |
| Sprachumschalter im Header | Klick wechselt Sprache, URL ändert sich |

---

## 4. Kontaktformular End-to-End

Dies ist der kritischste E2E-Test.

### Schritt 1 – Formular absenden

1. `/kontakt` öffnen
2. Alle Pflichtfelder ausfüllen:
   - Vorname: `Staging`
   - Nachname: `Test`
   - E-Mail: `staging@test.example`
   - Anfrageart: `Privatprojekt`
   - Nachricht: `Staging Smoke Test — bitte ignorieren`
3. Absenden-Button klicken

**Erwartung:** Erfolgsmeldung erscheint ("Vielen Dank..." o. ä.)  
**Fehler:** Rot-umrandetes Fehler-Banner → URL der Firebase Function oder n8n prüfen

### Schritt 2 – Firestore verifizieren

1. [Firebase Console](https://console.firebase.google.com) → Projekt `wsp-commerce`
2. **Firestore Database** → Collection **`leads`**
3. Neuestes Dokument öffnen und prüfen:

| Feld | Erwarteter Wert |
|---|---|
| `email` | `staging@test.example` |
| `firstName` | `Staging` |
| `leadType` | `private` |
| `status` | `new` |
| `source` | `kontakt-form` |
| `n8nStatus` | `sent` (wenn n8n aktiv) oder `failed` (ohne n8n — akzeptabel) |
| `createdAt` | Timestamp gesetzt |

### Schritt 3 – n8n verifizieren (nur wenn N8N_WEBHOOK_URL gesetzt)

1. n8n Dashboard → Workflows → Lead-Workflow
2. **Executions** → letzter Run → Status: `success`

---

## 5. SalesPopup

| Check | Erwartung |
|---|---|
| Nach 4 Sek. auf beliebiger Seite | Popup erscheint unten links |
| Popup zeigt Name, Ort, Produkt | Text vollständig dargestellt, kein Layout-Bruch |
| X-Button klicken | Popup verschwindet, erscheint nicht mehr |
| Puls-Punkt sichtbar | Grüner Punkt bei "gekauft", blauer Punkt bei "Projektanfrage" |

---

## 6. Mobile View (Chrome DevTools)

| Breakpoint | Seiten | Was prüfen |
|---|---|---|
| 375px (iPhone SE) | Homepage, `/products`, `/kontakt` | Kein horizontales Scrollen, Text lesbar, CTAs erreichbar |
| 390px (iPhone 14) | `/solarzaun`, `/impressum` | Hero-Bild korrekt, Navigation kollabiert sauber |
| 768px (iPad) | Homepage, `/products` | Zwischenbreite ohne Layout-Brüche |

---

## 7. Browser Console (Chrome DevTools)

Auf jeder Seite prüfen:

| Was | Akzeptabel? |
|---|---|
| Keine roten Fehler | ✓ Pflicht |
| `NEXT_PUBLIC_*`-Warnungen | Nur wenn Variable bewusst leer gelassen |
| Google Fonts 404 | ✗ — Netz-Problem auf Vercel (selten) |
| CORS-Fehler bei API-Call | ✗ — `CORS_ORIGIN` auf Railway falsch gesetzt |
| Hydration-Fehler | ✗ — Server/Client-Rendering stimmt nicht überein |

---

## 8. SEO & Meta

| Check | Erwartung |
|---|---|
| Homepage `<title>` | Enthält "Solarzaun" und/oder "SkyWind" |
| Produkt-Detailseite `<title>` | Produktname im Titel |
| `/impressum` robots | `noindex` gesetzt (kein SEO-Traffic erwünscht) |
| Sitemap | `/sitemap.xml` antwortet (kann leer sein in Staging) |

---

## 9. Bekannte Staging-Einschränkungen (kein Blocker)

| Punkt | Beschreibung |
|---|---|
| PayPal-Button deaktiviert | `NEXT_PUBLIC_PAYPAL_URL` nicht gesetzt → Button zeigt "nicht konfiguriert" |
| `n8nStatus: "failed"` in Firestore | Wenn kein n8n aktiv — Lead ist trotzdem gespeichert |
| Seed-Daten statt echter Produkte | Preise und Texte sind Testdaten |
| Impressum mit echten Daten | Bereits befüllt (WSP-Solarenergie, M. Fauerbach) |
| `/blog` leer | Wenn keine Blog-Posts in DB — leere Liste ist OK |

---

## 10. Code-Review-Befunde (vor Staging gefunden)

| Befund | Schwere | Handlung |
|---|---|---|
| Homepage API-Call in `try/catch` | Info | Rendert auch ohne Commerce API — OK |
| `env.COMMERCE_API_URL` wirft zur Laufzeit | Info | Build-Zeit: kein Problem. Runtime: Produktseiten zeigen Fehler wenn nicht gesetzt |
| `NEXT_PUBLIC_PAYPAL_URL` leer in Staging | Niedrig | PayPal-Button deaktiviert dargestellt — akzeptiertes Verhalten |
| Google Fonts Download bei lokalem Build langsam | Info | Nur Windows-Lokal-Problem; Vercel-Build nicht betroffen |
| `NEXT_PUBLIC_BANK_*` in `.env.local` | Info | Aktuell nicht im Code genutzt (PaymentOptions wurde umgebaut) |

---

## 11. Blocker für Production-Go-Live

Nach erfolgreichem Staging-Smoke-Test verbleiben für Production:

| Punkt | Beschreibung |
|---|---|
| Echte Produktdaten | Seed-Daten ersetzen via `import-products.ts` (siehe `docs/catalog-import.md`) |
| `NEXT_PUBLIC_PAYPAL_URL` setzen | PayPal-Link in Vercel Production-Vars |
| `CORS_ORIGIN` auf Production-Domain | Railway: von `*` auf echte Domain einschränken |
| Prisma-Migration erstellen | `prisma migrate dev --name init` → commiten → `migrate deploy` auf Railway |
| Firebase Billing aktivieren | Für höheres Lead-Volumen |
| Rate-Limiting auf Commerce API | Vor echtem Traffic |
| Custom Domain auf Vercel | DNS-Eintrag setzen |

---

## 12. Empfohlener nächster Task

> **Produktdaten für Production vorbereiten** — echte Produkte (Solarzaun, SkyWind, Kombilösung)  
> als `catalog-import.wsp.json` anlegen und mit `import-products.ts` in Staging einspielen.  
> Danach `status: draft → active` pro Produkt setzen und Produktseiten im Vercel-Preview verifizieren.

---

*Erstellt: 2026-04-29 | Staging-Smoke-Test nach Railway + Firebase + Vercel Deploy*
