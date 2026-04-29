# Commerce API Staging – Railway Deploy Guide

Scope: Staging-Deploy des Hono-Backends (`apps/commerce`) auf Railway Free Tier.  
Ziel: Öffentlich erreichbare Commerce API, damit Vercel-Preview vollständig rendern kann.

---

## 1. Warum Railway für Staging?

- Managed PostgreSQL inklusive (kein separates Setup)
- Free Tier ausreichend für Staging-Traffic
- Automatische Deploys via GitHub
- `DATABASE_URL` wird automatisch zwischen Services geteilt

---

## 2. Voraussetzungen

- [ ] Railway-Konto: [railway.app](https://railway.app) (GitHub-Login empfohlen)
- [ ] Railway CLI optional: `npm install -g @railway/cli`
- [ ] Git-Repository auf GitHub gepusht (alle Source-Dateien committed — Blocker-Abschnitt beachten)
- [ ] Lokaler Build muss durchlaufen: `pnpm --filter commerce run build`

---

## 3. Kritische Voraussetzung – Code muss committed und gepusht sein

Railway deployed aus dem Git-Repository. Alle Source-Dateien müssen committed sein:

```bash
# Workspace-Tarballs (Dependency-Blocker)
git add packages/types/wsp-types-0.0.1.tgz
git add packages/contracts/wsp-contracts-0.0.1.tgz

# Commerce API
git add apps/commerce/src/
git add apps/commerce/prisma/
git add apps/commerce/tsconfig.json
git add apps/commerce/tsconfig.seed.json
git add apps/commerce/.env.example

# Contract-Types (von Commerce API referenziert)
git add packages/contracts/src/ packages/contracts/tsconfig.json
git add packages/types/src/ packages/types/tsconfig.json

git commit -m "chore: stage Commerce API + workspace packages for Railway deploy"
git push
```

> `.env`-Dateien dürfen **nicht** committed werden. Sie sind via `.gitignore` ausgeschlossen.

---

## 4. Railway-Projekt anlegen

### Schritt 1 – Neues Projekt

1. Railway Dashboard → **New Project**
2. → **Deploy from GitHub repo**
3. Repository `wsp-commerce` auswählen → **Deploy Now**

Railway erstellt zunächst einen Service aus dem Root des Repos.

### Schritt 2 – PostgreSQL-Datenbank hinzufügen

Im Projekt-Dashboard:
1. **+ New** → **Database** → **Add PostgreSQL**
2. Railway erstellt automatisch eine verwaltete PostgreSQL-Instanz
3. `DATABASE_URL` wird automatisch als Railway-Variable im Projekt verfügbar

### Schritt 3 – Commerce API Service konfigurieren

Den automatisch erstellten Service (aus Schritt 1) konfigurieren:

→ Service anklicken → **Settings**

| Einstellung | Wert |
|---|---|
| **Root Directory** | *(leer – Repo-Root)* |
| **Build Command** | `pnpm install --frozen-lockfile && pnpm --filter commerce run db:generate && pnpm --filter commerce run build` |
| **Start Command** | `cd apps/commerce && npx prisma db push --accept-data-loss && node dist/server.js` |
| **Watch Paths** | `apps/commerce/**` (optional, spart Build-Trigger für irrelevante Änderungen) |

**Warum `pnpm` vom Repo-Root?**  
Railway klont das vollständige Repository. `--filter commerce` führt den Build nur für `apps/commerce` aus, mit korrekt aufgelöstem Workspace-Context.

**Warum `prisma db push` statt `migrate deploy`?**  
Das Migrations-Verzeichnis ist derzeit leer (keine erstellten Migration-Dateien). `db push` überträgt das Schema direkt auf die Datenbank. Für Production muss vorher `prisma migrate dev --name init` ausgeführt und committed werden.

---

## 5. Environment Variables

→ Service → **Variables**

### Pflicht

| Variable | Wert | Hinweis |
|---|---|---|
| `DATABASE_URL` | *(Railway-interne Variable)* | Über **Add Reference** → PostgreSQL Service → `DATABASE_URL` hinzufügen |

### Optional aber empfohlen für Staging

| Variable | Wert | Hinweis |
|---|---|---|
| `CORS_ORIGIN` | `*` | Für Staging: alle Origins erlaubt. Production: Storefront-Domain |
| `ADMIN_SECRET` | *(zufälliger String)* | `openssl rand -hex 32` — ohne diesen Wert ist Admin-API deaktiviert (fail-closed) |
| `BLOG_API_KEY` | *(zufälliger String)* | Nur nötig wenn n8n Blog-Posts schreibt |

> `PORT` wird von Railway automatisch gesetzt — **nicht manuell setzen**.

---

## 6. Datenbank einrichten und Seed-Daten einspielen

Nach dem ersten erfolgreichen Deploy:

### Option A – via Railway CLI

```bash
railway login
railway link          # Projekt verknüpfen
railway run pnpm --filter commerce run db:seed
```

### Option B – via Railway Shell

1. Service → **Shell** öffnen (Railway Dashboard)
2. Im Shell-Terminal ausführen:
```bash
pnpm --filter commerce run db:seed
```

### Was db:seed anlegt

3 Kategorien: `solarzaun`, `skywind`, `kombiloesung`  
3 Produkte mit Varianten (Testdaten, mehrsprachig DE/EN)

---

## 7. Deploy-URL notieren

Nach dem Deploy:
1. Service → **Settings** → **Domains**
2. **Generate Domain** → Railway generiert eine URL wie `wsp-commerce-production.up.railway.app`
3. URL notieren — wird als `COMMERCE_API_URL` in Vercel gesetzt

### CORS für Vercel-Previews aktualisieren

In Railway → Variables:
```
CORS_ORIGIN=*
```

Für Staging akzeptabel. Für Production auf Storefront-Domain einschränken.

---

## 8. Vercel mit Railway-URL verbinden

Im Vercel Dashboard → Storefront-Projekt → **Settings → Environment Variables**:

| Variable | Wert | Environment |
|---|---|---|
| `COMMERCE_API_URL` | `https://wsp-commerce-production.up.railway.app` | Preview |

Nach dem Setzen: Neues Deployment auslösen (Git-Push oder manuelles Redeploy).

---

## 9. Smoke-Test Commerce API

```bash
# Health-Check
curl https://wsp-commerce-production.up.railway.app/health
# Erwartet: {"status":"ok","service":"commerce","ts":"..."}

# Produkte abrufen
curl https://wsp-commerce-production.up.railway.app/api/catalog/products
# Erwartet: {"data":[...],"meta":{"total":3,...}}

# Kategorie abrufen
curl https://wsp-commerce-production.up.railway.app/api/catalog/categories
# Erwartet: {"data":[{"slug":"solarzaun",...},...],...}

# Einzelnes Produkt
curl https://wsp-commerce-production.up.railway.app/api/catalog/products/solarzaun-standard
```

---

## 10. Staging-Checkliste

- [ ] Repository enthält alle Commerce API Source-Dateien (committed + gepusht)
- [ ] `.tgz`-Tarballs committed (`packages/*/wsp-*.tgz`)
- [ ] Railway-Projekt angelegt, Repository verbunden
- [ ] PostgreSQL-Service hinzugefügt
- [ ] `DATABASE_URL` via Railway-Variable referenziert
- [ ] Build Command korrekt gesetzt
- [ ] Start Command mit `prisma db push` korrekt gesetzt
- [ ] Erster Deploy erfolgreich
- [ ] `GET /health` → 200 ✓
- [ ] `db:seed` ausgeführt → Produkte vorhanden
- [ ] `GET /api/catalog/products` → liefert 3 Produkte ✓
- [ ] Railway-URL in Vercel als `COMMERCE_API_URL` gesetzt
- [ ] Vercel-Preview Redeploy ausgelöst
- [ ] Produktseite im Browser öffnet mit echten Daten ✓

---

## 11. Risiken & Bekannte Einschränkungen

| Thema | Staging | Production |
|---|---|---|
| `prisma db push` statt Migrations | ✓ Akzeptabel | ✗ Migrations nötig: `prisma migrate dev --name init` |
| `CORS_ORIGIN=*` | ✓ Akzeptabel | ✗ Auf Storefront-Domain einschränken |
| Kein Rate-Limiting | Staging-Traffic = minimal | Vor Go-Live hinzufügen |
| Free-Tier-Schlafmodus (Railway) | Erster Request nach Inaktivität langsam | Kein Schlafmodus auf Pro/bezahltem Tier |
| Seed-Daten (keine echten Produkte) | ✓ Für Smoke-Test ausreichend | Echte Produktdaten vor Go-Live einspielen |

---

## 12. Blocker für Production-Go-Live

- [ ] `prisma migrate dev --name init` lokal ausführen, Migration commiten
- [ ] `CORS_ORIGIN` auf Production-Domain setzen
- [ ] Rate-Limiting auf Hono-Middleware ebene (z. B. `hono/rate-limiter`)
- [ ] `ADMIN_SECRET` als Railway-Secret gesetzt (nicht als Klartext-Variable)
- [ ] Echte Produktdaten über `import-products.ts` importiert
- [ ] Prod-PostgreSQL auf bezahltem Tier (Railway Starter Plan oder Managed DB)

---

## 13. Empfohlener nächster Task

Nach erfolgreichem Commerce API + Storefront Staging:

> **Lead-Ingestion in Staging verifizieren** — Firebase Function deployen (oder n8n-Webhook aktivieren),  
> `FIREBASE_LEAD_FUNCTION_URL` in Vercel setzen, Kontaktformular End-to-End testen.

---

*Erstellt: 2026-04-29 | Scope: Staging only – kein Production-Go-Live*
