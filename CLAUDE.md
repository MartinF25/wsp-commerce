# CLAUDE.md – wsp-commerce

Webshop + Lead-App für die Solarwind-Produktlinie (Solarzaun, SkyWind, Kombilösungen).

## Brand & Design

### Farbwelt
| Farbrolle | Farbe | Verwendung |
|---|---|---|
| Primär | Weiß `#FFFFFF` | Hintergründe, Flächen |
| Sekundär | Anthrazit `#1C1C1E` | Texte, Headlines |
| Neutral | Grau `#6B7280` | Subtexte, Rahmen |
| Akzent | Energie-Grün `#22C55E` oder Blau `#3B82F6` | CTAs, Highlights |

### Typografie
- Headlines: *Sora*, *DM Sans* oder *Outfit*
- Body: *Inter* oder *Plus Jakarta Sans*

### CTAs
- Primär: **„Beratung anfragen"**
- Sekundär: „Projekt besprechen", „Jetzt anfragen", „Rückruf anfordern"

### Tonalität
- Klar, professionell, beratungsorientiert
- Keine Floskeln, keine reißerischen Versprechen
- Zielgruppe sofort abholen, Nutzen konkret benennen

## Architecture
- **Monorepo** mit pnpm workspaces + Turborepo
- `apps/storefront` — Next.js (Frontend)
- `apps/commerce` — PostgreSQL Commerce Core (REST/tRPC API)
- `apps/firebase` — Firebase Auth + Functions
- `apps/admin` — Internes Backoffice (optional)
- `packages/` — Shared UI, Types, Contracts, Config

## Key Docs
- [Architecture](./docs/architecture.md)
- [Product Model](./docs/product-model.md)
- [Commerce Core](./docs/commerce-core.md) — API-Referenz, Service-Layer, Contracts
- [Phase-2-Status](./docs/phase-2-status.md) — Abschluss-Check + offene Punkte
- [Lead Flow](./docs/lead-flow.md)
- [Checkout Flow](./docs/checkout-flow.md)
- [Payments](./docs/payments.md)
- [Deployment](./docs/deployment.md)
- [Vercel Staging](./docs/vercel-staging.md) — Staging-Deploy-Guide, Blocker, Smoke-Test
- [Railway Staging](./docs/railway-staging.md) — Commerce API auf Railway, Env-Vars, Seed
- [Firebase Staging](./docs/firebase-staging.md) — onLeadSubmit deployen, Firestore, Smoke-Test
- [Smoke-Test](./docs/smoke-test.md) — End-to-End Checkliste für alle drei Services

## Skills
- `.claude/skills/hybrid-architecture/` — Architektur-Entscheidungen
- `.claude/skills/n8n-firebase-lead-flow/` — Lead-Automatisierung
- `.claude/skills/postgres-commerce-core/` — Commerce-Backend

## Development
```bash
pnpm install
docker-compose up -d                    # PostgreSQL (5432) + n8n (5678)
pnpm --filter commerce db:generate     # Prisma-Client generieren (nach Schema-Änderungen)
pnpm --filter commerce db:migrate      # DB-Schema anlegen (erster Start)
pnpm --filter commerce db:seed         # Testdaten einspielen (idempotent)
pnpm --filter commerce dev             # Commerce API auf :3001
```

## Rules
- Preise immer in Cent (integer), niemals float
- Formularfelder: Vorname, Nachname, Firma (optional), E-Mail, Telefon, Anfrageart, Projektart, Nachricht
- Anfragearten: Privatprojekt, Gewerbeprojekt, Landwirtschaft/Hof, Partneranfrage, Händleranfrage, Montagepartnerschaft, Allgemeine Beratung
- Projektarten: Solarzaun, SkyWind, Kombilösung, Beratung gewünscht
- Mobile-First, Core Web Vitals grün
- Jede Hauptseite hat mindestens einen CTA oberhalb der Falz
