# Pricing Model — Commerce Catalog Foundation

## Overview

Commerce pricing is built on **variant-level pricing** with optional **product-level display pricing** for storefront aggregation.

### Principle

- **Variants are purchasable units** → pricing lives on `ProductVariant`
- **Product-level display pricing** is optional, computed by app → stored in `price_cents_min_display` for storefront "ab €X" hints
- **No checkout or order-level pricing logic** in this model (Phase 3+)

---

## Core Structure

### ProductVariant (Primary Pricing Layer)

```prisma
model ProductVariant {
  id            String  @id @default(uuid())
  product_id    String
  sku           String  @unique
  name          String
  price_cents   Int?    // nullable for inquiry_only; enforced required (app) for direct_purchase/configurable
  currency      String  @default("EUR")
  stock_quantity Int?   // nullable for inquiry_only; enforced required (app) for direct_purchase/configurable
  attributes    Json?   // flexible metadata
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
}
```

**Why Variant-Level:**
- Every purchasable unit has its own price
- Solarzaun 3m "Anthrazit" = different price than Solarzaun 5m "Anthrazit"
- Kabel 2.5mm × 50m = different price than Kabel 2.5mm ×100m
- Supports `configurable` products (variants represent different configurations)

**Constraints:**
- `price_cents` is integer (always cents, never float) → `€1.99 = 199`
- `currency` defaults to `EUR` — app enforces single currency per product (all variants same currency)
- Nullable for `inquiry_only` only (price TBD in lead-to-offer journey)

---

### Product (Display Pricing Layer)

```prisma
model Product {
  // ... other fields ...
  price_cents_min_display Int? // nullable; app-computed from variants
}
```

**Purpose:**
- Storefront can show "ab €X.XX" (starting from lowest variant price)
- Not source of truth — computed from variants
- Optional; app must set/update via business logic

**Why not required:**
- Variants are source of truth
- App-layer service computes min/max/average pricing
- Display price can be null if no variants have prices yet (drafts, inquiry_only products)

---

## Pricing by Product Type

| Product Type | price_cents | stock_quantity | Storefront Display |
|---|---|---|---|
| **direct_purchase** | NOT NULL (app enforces) | NOT NULL | Fixed price: `€X.XX` |
| **configurable** | NOT NULL after config (app enforces) | NOT NULL per variant | "ab €X.XX" (min variant price) |
| **inquiry_only** | NULL (optional) | NULL (not tracked) | "Preis auf Anfrage" or "ab €X.XX" (indicative only) |

---

## Pricing Rules (App-Enforced, Not DB-Enforced)

### 1. direct_purchase Products

```typescript
// App validation
if (product.product_type === "direct_purchase") {
  // Every variant must have price_cents NOT NULL
  assert(variant.price_cents !== null, "direct_purchase variant must have price");
  // Storefront displays this price directly
  displayPrice = variant.price_cents / 100; // €X.XX
}
```

### 2. configurable Products

```typescript
// After user configures (selects options):
if (product.product_type === "configurable") {
  // Selected variant has price_cents
  assert(selectedVariant.price_cents !== null, "configurable must resolve to priced variant");

  // Storefront MAY show "ab €X.XX" before config (from price_cents_min_display)
  // Or MAY hide price until config complete
  // App decides UX strategy
}
```

### 3. inquiry_only Products

```typescript
// App logic
if (product.product_type === "inquiry_only") {
  // price_cents is optional — project price is quoted later
  // If price_cents_min_display set: show "ab €X.XX" as soft hint
  // Storage for later calculation is in Firestore leads, not PostgreSQL
}
```

---

## Currency Handling

- All prices are in cents (integer)
- `currency` on `ProductVariant` defaults to `"EUR"` (ISO 4217)
- **App enforces:** all variants of a product must have the same currency
- Multi-currency support (future): would add per-variant currency overrides or separate price tables

---

## Price Display Examples

### Scenario 1: Direct Purchase (Fixed Price)

```
Product: "Kabel 2.5mm"
├─ Variant SKU: KABEL-2.5-50M, name: "50m", price_cents: 9999, currency: EUR
│                                                  ↓
Storefront shows: "€99.99"
```

### Scenario 2: Configurable (Multiple Options)

```
Product: "Solarzaun [Konfigurator]"
  product.price_cents_min_display: 29999  (from cheapest variant)
├─ Variant: "3m Anthrazit", price_cents: 29999
├─ Variant: "5m Anthrazit", price_cents: 39999
├─ Variant: "3m Weiß", price_cents: 32999
└─ Variant: "5m Weiß", price_cents: 42999

Before config: "ab €299.99"
After selecting "5m Weiß": "€429.99"
```

### Scenario 3: Inquiry Only (Project-Based)

```
Product: "Solarzaun Gesamtanlage [Projekt]"
  product.price_cents_min_display: null (or  29999 as soft hint)
└─ Variant: (none, or generic), price_cents: null

Storefront shows: "Preis auf Anfrage" (or "ab €299.99" if hint provided)
Lead form triggered → Firebase → offer quote later
```

---

## No Checkout/Order Logic Here

**Explicitly NOT modeled in this phase:**
- Cart line items (Phase 3)
- Order totals or line item prices (Phase 3)
- Discounts or coupons (Phase 4)
- Tax calculations (Phase 4)
- Price history or audit logs (Phase 5)

**Why:**
- Pricing model is for **catalog** only
- Checkout pricing (with discounts, taxes, shipping) is a separate concern (Phase 3)
- Decoupling now = cleaner design later

---

## Future Extensibility

This model supports:
- **Multi-currency** (add per-variant currency override)
- **Bulk pricing** (add `min_quantity` tier to variant pricing)
- **Discounts** (add `PriceDiscount` table linking to ProductVariant or CartItem)
- **Dynamic pricing** (add `valid_from / valid_to` to versioned price records)
- **Price history** (add `ProductVariantPrice` audit table)

---

## Summary

| Aspect | Implementation |
|---|---|
| **Primary pricing** | `ProductVariant.price_cents` (integer, cents) + `currency` |
| **Display pricing** | `Product.price_cents_min_display` (app-computed) |
| **Rules** | App-enforced per product_type (DB nullable allows flexibility) |
| **Scope** | Catalog only (no checkout, no orders) |
| **Extensibility** | Support for future discounts, taxes, multi-currency |
