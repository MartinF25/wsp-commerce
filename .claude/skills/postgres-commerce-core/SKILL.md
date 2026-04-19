# Skill: PostgreSQL Commerce Core

This skill covers the commerce backend (`apps/commerce/`):
- Product catalog, variants, pricing
- Orders, line items, fulfillment
- Inventory management
- Discount / coupon engine

## Stack
- PostgreSQL (via Docker in dev, managed in prod)
- Prisma ORM or raw SQL via `postgres` / `kysely`
- REST or tRPC API consumed by storefront

## Key Docs
- [Product Model](../../../docs/product-model.md)
- [Checkout Flow](../../../docs/checkout-flow.md)
- [Payments](../../../docs/payments.md)
