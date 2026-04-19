# Architecture Overview

## System Components

```
┌─────────────────────────────────────────────────┐
│                  Storefront (Next.js)            │
│         apps/storefront  — SSR / SSG / ISR       │
└────────────────────┬────────────────────────────┘
                     │ REST / tRPC
          ┌──────────┴──────────┐
          ▼                     ▼
┌──────────────────┐   ┌─────────────────────┐
│  Commerce Core   │   │  Firebase            │
│  apps/commerce   │   │  Auth + Realtime     │
│  PostgreSQL      │   │  apps/firebase       │
└──────────────────┘   └──────────┬──────────┘
                                  │ Webhooks
                                  ▼
                        ┌─────────────────┐
                        │      n8n         │
                        │  Automation /    │
                        │  Lead Flow       │
                        └─────────────────┘
```

## Monorepo Structure

- **apps/storefront** — Next.js frontend, consumes commerce API + Firebase auth
- **apps/commerce** — PostgreSQL-backed commerce API (products, orders, inventory)
- **apps/firebase** — Firebase Functions, Firestore rules, auth config
- **apps/admin** — Internal backoffice (optional)
- **packages/** — Shared UI, types, contracts, config

## Data Flow

1. User browses storefront → reads from commerce API (products, catalog)
2. User authenticates → Firebase Auth
3. User places order → commerce API writes to PostgreSQL
4. Lead / inquiry → Firebase Function → n8n webhook → CRM / notification
