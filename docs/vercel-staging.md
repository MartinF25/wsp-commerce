# Vercel Staging – Storefront Deploy Guide

Scope: Staging/Preview-Deploy der Storefront (`apps/storefront`) auf Vercel.  
Kein Production-Launch. Keine Commerce-, Firebase- oder n8n-Automatisierung in diesem Dokument.

---

## 1. Ziel & Abgrenzung

| | Staging (dieser Guide) | Production |
|---|---|---|
| Deployment | Vercel Preview Deployments | `main`-Branch, nach Smoke-Test |
| URL | `*.vercel.app`-Preview-URLs | Custom Domain |
| Echte Daten | Nein – Staging-Instanzen | Ja |
| Go-Live | Kein öffentlicher Launch | Erst nach echten Produktdaten + Smoke-Test |

---

## 2. Voraussetzungen

- [ ] Vercel-Konto vorhanden (kostenloser Hobby-Plan reicht für Staging)
- [ ] GitHub-Repository mit Vercel verbunden
- [ ] Commerce API auf einer öffentlich erreichbaren Staging-URL deployed  
  (Railway Free Tier, Render Free, o. ä.) — `localhost:3001` funktioniert **nicht** aus Vercel heraus
- [ ] Firebase-Projekt `wsp-commerce` existiert (für Lead-Ingestion optional, aber empfohlen)

---

## 3. Kritische Blocker – vor erstem Deploy prüfen

### Blocker 1 – Fehlende .tgz-Dateien im Git-Repository (MUST FIX)

Die Storefront hat folgende lokale Abhängigkeit:

```json
"@wsp/types": "file:../../packages/types/wsp-types-0.0.1.tgz"
```

Diese `.tgz`-Dateien sind aktuell **nicht committed** (stehen als `??` in `git status`).  
Vercel klont das Repository → Dateien fehlen → `pnpm install` schlägt fehl.

**Fix vor dem ersten Vercel-Deploy:**

```bash
git add packages/types/wsp-types-0.0.1.tgz
git add packages/contracts/wsp-contracts-0.0.1.tgz
git commit -m "chore: commit packed workspace tarballs for Vercel install"
```

**Langfristige Alternative (empfohlen, aber kein Scope dieses Tasks):**  
Auf `workspace:*`-Protokoll umstellen, damit pnpm direkt aus dem Source-Ordner installiert.

### Blocker 2 – Commerce API muss erreichbar sein

`COMMERCE_API_URL` muss auf eine für Vercel-Server erreichbare URL zeigen.  
Ohne diese Variable rendern Produktseiten serverseitig Fehler.  
Staging-Minimal-Option: Commerce API auf Railway/Render deployen (Free Tier, keine Custom Domain nötig).

### Blocker 3 – pnpm-lock.yaml muss committed und aktuell sein

Nach dem Commit der `.tgz`-Dateien: Lock-File auf Stand prüfen.

```bash
pnpm install --frozen-lockfile   # darf nicht fehlschlagen
```

Falls Fehler: `pnpm install` ohne Flag ausführen, Lock-File committen.

---

## 4. Vercel-Projekt-Einstellungen (Dashboard)

Projekt-Einstellungen im Vercel Dashboard unter **Settings → General**:

| Einstellung | Wert |
|---|---|
| **Framework Preset** | Next.js |
| **Root Directory** | `apps/storefront` |
| **Node.js Version** | **20.x** (gemäß `engines.node >= 20` in root `package.json`) |
| **Install Command** | `cd ../.. && pnpm install --frozen-lockfile` |
| **Build Command** | `next build` |
| **Output Directory** | *(leer lassen – Next.js Preset erkennt `.next` automatisch)* |

**Warum `cd ../..` beim Install Command?**  
Vercel wechselt für Build-Commands in das Root Directory (`apps/storefront`). `pnpm install` muss aber vom Repo-Root ausgeführt werden, damit Workspace-Pakete (`@wsp/types` etc.) korrekt aufgelöst werden.

**pnpm-Version:** Vercel erkennt pnpm automatisch anhand der `pnpm-lock.yaml` im Repo-Root. Keine explizite Angabe nötig.

---

## 5. Env-Variablen für Preview / Staging

Im Vercel Dashboard unter **Settings → Environment Variables** für Environment **Preview** setzen.  
**Keine echten Production-Werte. Keine Secrets im Repository.**

### Pflicht-Variablen (ohne die der Build scheitert oder Seiten fehlerhafte Inhalte zeigen)

| Variable | Beschreibung | Staging-Beispielwert |
|---|---|---|
| `COMMERCE_API_URL` | URL des Hono-Backends (`apps/commerce`) | `https://wsp-commerce-api.railway.app` |

### Optionale Variablen (Fallback-Kette für Lead-Ingestion)

| Variable | Beschreibung | Hinweis |
|---|---|---|
| `FIREBASE_LEAD_FUNCTION_URL` | URL der deployten Firebase Function `onLeadSubmit` | Wenn gesetzt: Lead → Firebase. Wenn leer: Fallback auf n8n. |
| `N8N_WEBHOOK_URL` | Basis-URL der n8n-Instanz (ohne trailing slash) | Wird genutzt wenn `FIREBASE_LEAD_FUNCTION_URL` leer ist. |

> **Lead-Ingestion im Staging:** Entweder Firebase-URL setzen (Firebase muss deployed sein)  
> oder n8n-URL setzen (n8n muss erreichbar sein).  
> Wenn beide leer: Das Kontaktformular schlägt serverseitig fehl. Für Staging akzeptabel,  
> muss aber vor dem Smoke-Test gelöst sein.

### NEXT_PUBLIC_ Variablen (werden zum Build-Zeitpunkt in den Client-Bundle eingebettet)

| Variable | Beschreibung | Staging-Empfehlung |
|---|---|---|
| `NEXT_PUBLIC_STOREFRONT_URL` | Für Share-Links und SEO (`<meta>` canonical) | Vercel Preview-URL einsetzen, z. B. `https://storefront-git-main-yourteam.vercel.app` – nach erstem Deploy bekannt |
| `NEXT_PUBLIC_PAYPAL_URL` | PayPal-Zahlungslink | Leer lassen für Staging → Button wird als „nicht konfiguriert" dargestellt |

### Wann sind Env-Updates wirksam?

> Nach jeder Änderung an Environment Variables muss ein neues Deployment ausgelöst werden  
> (Dashboard → Deployments → Redeploy, oder neuer Git-Push).

### Production-Variablen

Für Production (`main`-Branch) erst setzen, wenn:
- echte Commerce API mit Produktionsdaten deployed
- echte Firebase Function deployed
- Custom Domain konfiguriert

---

## 6. Staging-Strategie

### Option A – Vercel Preview Deployments (empfohlen für Staging)

Jeder Push auf einen **Nicht-`main`-Branch** erzeugt automatisch eine Preview-URL.

```
Workflow:
Feature/Fix-Entwicklung → Push auf branch → Vercel baut Preview → Smoke-Test auf Preview-URL
→ Merge auf main → Production-Deploy (erst nach explizitem Freigabe-Schritt)
```

Vorteile:
- Kein separater Branch-Management-Aufwand
- Jeder PR bekommt eigene Preview-URL
- Production bleibt geschützt

### Option B – Dedizierter `staging`-Branch

```bash
git checkout -b staging
git push -u origin staging
```

Dann in Vercel: Branch-Filter für Production auf `main` beschränken (ist Standard).  
`staging`-Branch deployed als Preview-Environment.

### Production-Schutz

- In Vercel Dashboard: **Settings → Git → Production Branch** muss `main` sein (Standard)
- Kein direktes `vercel --prod` ohne bewussten Schritt
- Production-Domain erst nach Go-Live-Freigabe zuweisen

---

## 7. Schritt-für-Schritt: Erster Staging-Deploy

```
1. Blocker 1 beheben
   → .tgz-Dateien committen (siehe Abschnitt 3)

2. Pnpm-Lock-File prüfen
   → pnpm install --frozen-lockfile lokal ausführen

3. Lokalen Build testen
   → pnpm --filter storefront build
   → Darf keine TypeScript-Fehler oder Build-Fehler zeigen

4. Vercel-Projekt anlegen
   → Vercel Dashboard → Add New Project → Repository verbinden
   → Root Directory: apps/storefront
   → Framework Preset: Next.js

5. Vercel-Einstellungen setzen
   → Install Command: cd ../.. && pnpm install --frozen-lockfile
   → Build Command: next build
   → Node.js Version: 20.x

6. Env-Variablen setzen (Preview Environment)
   → COMMERCE_API_URL
   → FIREBASE_LEAD_FUNCTION_URL (oder N8N_WEBHOOK_URL)
   → NEXT_PUBLIC_STOREFRONT_URL (nach erstem Deploy eintragen, dann Redeploy)

7. Deployment auslösen
   → Git-Push auf einen Branch (nicht main) → Vercel baut Preview
   → Alternativ: Dashboard → Deployments → Deploy

8. Smoke-Test durchführen (Abschnitt 8)
```

---

## 8. Smoke-Test-Checkliste (nach Vercel-Deploy)

Führe diese Checks auf der Vercel-Preview-URL durch:

### Seiten & Navigation

- [ ] **Homepage** (`/`) öffnet ohne Fehler, Hero-Bereich sichtbar
- [ ] **Produktliste** (`/products`) öffnet und zeigt Produkte (prüft `COMMERCE_API_URL`)
- [ ] **Produktdetailseite** (`/products/[slug]`) öffnet vollständig
- [ ] `/solarzaun` öffnet korrekt
- [ ] `/skywind` öffnet korrekt
- [ ] `/kombiloesungen` öffnet korrekt
- [ ] `/privatkunden` öffnet korrekt
- [ ] `/gewerbe-b2b` öffnet korrekt
- [ ] `/faq` öffnet korrekt
- [ ] `/kontakt` öffnet korrekt

### Rechtliche Pflichtseiten

- [ ] `/impressum` öffnet – Placeholder-Blöcke notieren (für Production befüllen)
- [ ] `/datenschutz` öffnet vollständig

### Funktionen

- [ ] **Kontaktformular** (`/kontakt`) absenden → HTTP 200 oder Erfolgs-Feedback
- [ ] **Firestore-Prüfung**: Firebase Console → Firestore → Collection `leads` → neuer Eintrag vorhanden
- [ ] **n8n-Prüfung** (falls aktiv): n8n-Dashboard → Workflow → Execution-Log zeigt erfolgreichen Run

### Technisch

- [ ] **Mobile View**: Chrome DevTools → iPhone-Breakpoint → keine Layout-Brüche
- [ ] **Browser Console**: keine kritischen JS-Fehler (Warnings sind OK)
- [ ] **Bildladung**: Produktbilder laden (keine 404-Fehler)
- [ ] **Vercel Build Log**: kein `warn` zu ungesetzten Env-Variablen

---

## 9. Risiken & Blocker

### Blocker für Staging-Deploy

| Blocker | Beschreibung | Lösung |
|---|---|---|
| `.tgz`-Dateien nicht committed | `pnpm install` schlägt auf Vercel fehl | `git add packages/*/wsp-*.tgz && git commit` |
| `COMMERCE_API_URL` nicht gesetzt | Produktseiten schlagen serverseitig fehl | Commerce API auf Railway/Render deployen |
| `pnpm-lock.yaml` veraltet | `--frozen-lockfile` schlägt fehl | `pnpm install` lokal, Lock-File committen |

### Nur Risiken für Staging (kein Blocker)

| Risiko | Beschreibung | Akzeptabel für Staging? |
|---|---|---|
| Leere Lead-Ingestion-URLs | Kontaktformular funktioniert nicht | Akzeptabel, wenn nur UI getestet wird |
| Placeholder in `/impressum` | Rechtlich unvollständig | Ja – kein öffentlicher Launch |
| `NEXT_PUBLIC_STOREFRONT_URL` leer | Share-Links + canonicals fehlerhaft | Ja – nach erstem Deploy nachtragen |
| `NEXT_PUBLIC_PAYPAL_URL` leer | PayPal-Button inaktiv | Ja – Staging-Feature |

### Blocker für Production-Go-Live (kein Scope dieses Tasks)

| Blocker | Beschreibung |
|---|---|
| Echte Produktdaten | `db:seed` liefert Testdaten – Production braucht echte Inhalte |
| Commerce API mit Prod-DB | PostgreSQL mit Produktionsdaten, `prisma migrate deploy` |
| Firebase Function deployed | Lead-Ingestion in Production ohne Fehler |
| Placeholder im Impressum befüllt | Gesetzliche Pflicht (§ 5 TMG) |
| Custom Domain konfiguriert | `yourdomain.com` auf Vercel zeigen |
| Rate-Limiting auf Commerce API | Vor Production-Traffic nötig (dokumentiert in `phase-2-status.md`) |
| SSL-Zertifikat | Vercel stellt automatisch via Let's Encrypt aus |
| CORS auf Commerce API | `CORS_ORIGIN` auf Production-Domain setzen |

---

## 10. Empfohlener nächster Task

Nach erfolgreichem Staging-Smoke-Test:

> **Commerce API Staging-Deploy** – Railway oder Render Free-Tier-Instanz mit Seed-Daten,  
> damit Produktseiten im Vercel-Preview vollständig rendern können.

Danach: Lead-Ingestion (Firebase Function + n8n) in Staging-Umgebung verifizieren,  
sodass das Kontaktformular End-to-End getestet werden kann.

---

*Erstellt: 2026-04-29 | Scope: Staging only – kein Production-Go-Live*
