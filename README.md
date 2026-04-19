# wsp-commerce

Webshop + Lead-App für Solarzaun, SkyWind und Kombilösungen.

## Stack

- **Storefront**: Next.js (SSR/ISR)
- **Commerce API**: Node.js + PostgreSQL
- **Auth & Functions**: Firebase
- **Automation**: n8n
- **Payments**: Stripe
- **Monorepo**: pnpm workspaces + Turborepo

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment variables
cp .env.example .env
# → fill in .env values

# 3. Start infrastructure (PostgreSQL + n8n)
docker-compose up -d

# 4. Start all apps
pnpm dev
```

## Apps

| App | Port | Description |
|---|---|---|
| storefront | 3000 | Next.js frontend |
| commerce | 4000 | Commerce API |
| admin | 3001 | Backoffice (optional) |

## Docs

See [`/docs`](./docs/) for architecture, product model, checkout flow, and deployment guides.
