# Skill: Hybrid Architecture

This skill covers the hybrid architecture of wsp-commerce:
- Next.js storefront (SSR/SSG) connected to PostgreSQL commerce core
- Firebase for auth, real-time features, and lead flow
- n8n for automation and webhook processing

## Key Decisions
- PostgreSQL is the source of truth for products, orders, inventory
- Firebase handles authentication and push notifications
- n8n orchestrates lead capture → CRM → notification flows

## Relevant Docs
- [Architecture Overview](../../../docs/architecture.md)
- [Lead Flow](../../../docs/lead-flow.md)
