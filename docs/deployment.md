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
