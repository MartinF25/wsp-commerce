# Skill: PostgreSQL Commerce Core

This skill covers the commerce backend (`apps/commerce/`):
- Product catalog, variants, pricing
- Orders, line items, fulfillment
- Inventory management
- Discount / coupon engine

## Stack
- PostgreSQL (via Docker in dev, managed in prod)
- Prisma ORM — schema in `apps/commerce/prisma/schema.prisma` (see ADR-002)
- REST API consumed by storefront (see ADR-001)

## Key Docs
- [Product Model](../../../docs/product-model.md)
- [Checkout Flow](../../../docs/checkout-flow.md)
- [Payments](../../../docs/payments.md)
- [ADR-001: API Style](../../../docs/decisions/001-api-style.md)
- [ADR-002: ORM Strategy](../../../docs/decisions/002-orm-strategy.md)
