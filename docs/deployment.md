# Deployment

## Environments

| Environment | Branch | URL |
|---|---|---|
| Production | `main` | `https://yourdomain.com` |
| Preview | PR branches | Vercel preview URLs |
| Local | — | `localhost:3000` (storefront), `localhost:4000` (commerce) |

## Storefront (apps/storefront)
- Deploy to **Vercel** (recommended) or any Node.js host
- Environment variables set in Vercel dashboard
- Set `NEXT_PUBLIC_GA_ID` in the hosting environment if Google Analytics should be active

## Commerce API (apps/commerce)
- Deploy to **Railway**, **Render**, or **VPS with Docker**
- PostgreSQL managed database (Railway Postgres, Supabase, or self-hosted)

## Firebase (apps/firebase)
- Deploy via `firebase deploy`
- CI deploys on merge to `main`

## Docker (local dev)
```bash
docker-compose up
```
Starts: PostgreSQL, n8n, (optionally) Redis

## Environment Variables
Copy `.env.example` to `.env` and fill in all values before running locally.

Important storefront variables:
- `NEXT_PUBLIC_STOREFRONT_URL` = public storefront URL
- `COMMERCE_API_URL` = reachable commerce backend
- `NEXT_PUBLIC_GA_ID` = active GA4 measurement ID, e.g. `G-SH1YKYJ8GV`
