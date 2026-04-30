# Seed Data Structure — Commerce Catalog

## Overview

The seed script (`apps/commerce/prisma/seed.ts`) populates the local PostgreSQL database with realistic test data supporting all three `product_type` workflows: `direct_purchase`, `configurable`, and `inquiry_only`.

**Running the seed:**
```bash
cd apps/commerce
npm run db:seed
# or
npx prisma db seed
```

---

## Categories

Three organizational hierarchies to mirror real storefront navigation:

| Slug | Name | Purpose |
|---|---|---|
| `solarzaun` | Solarzaun | Product line: fence-integrated solar |
| `skywind` | SkyWind | Product line: small wind turbines |
| `zubehor` | Zubehör & Montage | Supporting: cables, mounting kits, hardware |

---

## Products by Type

### 1. **direct_purchase** (2 products)

Directly purchasable, fixed-price, inventory-tracked items. Simulate shop consumables.

#### a) Solarzaun Kabel & Verbinder Paket
```
SKU:           KABEL-PAKET-001
Name:          Standard Paket
Price:         €49.99 (4999 cents)
Stock:         100 units
Attributes:    gauge_mm: 2.5, length_m: 100
Description:   Complete cable set for Solarzaun installation
```

**Why this?** Represents Zubehör (accessories) that can be added to cart immediately. No configuration needed.

#### b) Montagekit Basic
```
SKU:           MOUNT-BASIC-001
Name:          Für 3m Zaun
Price:         €79.99 (7999 cents)
Stock:         50 units
Attributes:    fence_length_m: 3
Description:   Basic fastening set for 3m solar fence
```

**Why this?** Complementary product to main offerings. Ready-to-purchase consumable.

---

### 2. **configurable** (2 products)

Products requiring user selection before checkout. Pricing is calculable after configuration.

#### a) Solarzaun Set [Konfigurierbar]
```
4 Variants (all purchasable after config):
  1. SKU: SZ-3M-ANTHR    → €299.99 (29999 cents)  [3m, Anthrazit, 400W]
  2. SKU: SZ-5M-ANTHR    → €399.99 (39999 cents)  [5m, Anthrazit, 600W]
  3. SKU: SZ-3M-WHITE    → €329.99 (32999 cents)  [3m, Weiß, 400W]
  4. SKU: SZ-5M-WHITE    → €429.99 (42999 cents)  [5m, Weiß, 600W]

Attributes per variant: length_m, color, power_w, modules
```

**Why this?** Core product line. Multiple configurations (length × color) = different prices. User selects, then goes to cart.

#### b) SkyWind NG [Konfigurierbar]
```
2 Variants (power classes):
  1. SKU: SKYWIND-5KW    → €599.99 (59999 cents)   [5kW, 3.8m rotor]
  2. SKU: SKYWIND-10KW   → €999.99 (99999 cents)  [10kW, 5.0m rotor]

Attributes per variant: power_kw, rotor_diameter_m, hub_height_m, annual_yield_kwh
```

**Why this?** Second product line. Power selection = configuration choice. Enables comparing output vs. cost.

---

### 3. **inquiry_only** (2 products)

Project-based offerings. No direct checkout. Lead → Firestore → offer workflow.

#### a) Solarzaun Großanlage [Projekt]
```
SKU:           PROJECT-SOLARZAUN-001
Name:          Großanlage (Länge & Leistung nach Projek)
Price:         null (project-based)
Stock:         null (not tracked)
Attributes:    project_scope, includes (Standortprüfung, Planung, Montage, etc.)
price_cents_min_display: 300000 (€3000 as soft hint)
Description:   Individual solar fence installation. Requires on-site survey & quote.
```

**Why this?** Large installations for farms/commercial. Scope is custom → price is quoted later.

#### b) SkyWind Komplettanlage [Projekt]
```
SKU:           PROJECT-SKYWIND-001
Name:          Komplettanlage inkl. Fundament & Elektrik
Price:         null (project-based)
Stock:         null (not tracked)
Attributes:    project_scope, includes (Fundament, Turbine, Elektroanbindung, 5J Service)
price_cents_min_display: null (no hint for complex projects)
Description:   Professional wind energy solution (full turnkey).
```

**Why this?** Large-scale wind installations. Highly site-specific → requires bid process.

---

## Design Rationale

### Product Type Distribution

| Type | Count | Rationale |
|---|---|---|
| direct_purchase | 2 | Accessories/consumables. Quick purchases. Test immediate cart flow. |
| configurable | 2 | Core product lines (Solarzaun, SkyWind). User selects → variant resolved → price set. |
| inquiry_only | 2 | Large projects. Represent the other flow (lead, not cart). |

**Total:** 6 products, 10 variants, 3 categories.

### Variant Strategy

- **direct_purchase:** 1 variant per product (single SKU)
- **configurable:** Multiple variants (length × color for Solarzaun, power for SkyWind)
- **inquiry_only:** 1 generic variant (actual scope is custom)

### Pricing

- **Direct:** Fixed `price_cents` (e.g., €49.99)
- **Configurable:** Priced variants (min €299.99, max €429.99 for Solarzaun)
- **Inquiry:** `price_cents` is `null` (quoted later)
- **Display:** `price_cents_min_display` populated for direct + configurable, soft hint for inquiry

### Attributes (JSONB)

Flexible per product type:

```json
// Cable
{
  "gauge_mm": 2.5,
  "length_m": 50
}

// Solarzaun variant
{
  "length_m": 3,
  "color": "Anthrazit",
  "power_w": 400,
  "modules": 4
}

// SkyWind variant
{
  "power_kw": 5,
  "rotor_diameter_m": 3.8,
  "hub_height_m": 6,
  "annual_yield_kwh": 8500
}

// Inquiry project
{
  "project_scope": "Individuell angepasste Großanlage",
  "includes": "Standortprüfung, Planung, Montage, Elektroanbindung"
}
```

---

## Supporting Storefront & API Development

### What the Seed Enables

1. **Product Listing API (`GET /products`)**
   - Filter by `product_type`: `?type=direct_purchase`
   - Filter by `category`: `?category=solarzaun`
   - See realistic product cards on storefront

2. **Product Detail Page (`GET /products/[slug]`)**
   - Show single product with all variants + images
   - Direct: show fixed price
   - Configurable: show variant selection UI + price updater
   - Inquiry: show "Request quote" CTA

3. **Category Navigation (`GET /categories`)**
   - Hierarchical menu items (Solarzaun, SkyWind, Zubehör)
   - Easy to build sidebar/breadcrumb UX

4. **Cart Simulation (Phase 3)**
   - Add direct_purchase item → to cart with price
   - Add configurable item → variant resolves price
   - Try adding inquiry_only → blocked (UI enforces)

5. **Admin Interface (Phase 5)**
   - See realistic products to manage
   - Edit variants, prices, stock

---

## Resetting Seed Data

**If seed data gets corrupted or you need a fresh start:**

```bash
# ⚠️ WARNING: Resets entire database
npx prisma migrate reset

# This will:
# 1. Drop all tables and recreate schema
# 2. Re-run all migrations
# 3. Execute seed script automatically
```

---

## Future Seed Enhancements

As the project grows, seed can include:

- More complex categor hierar hierarchies (subcategories)
- Bulk pricing tiers (min qty for discount)
- Product tags or filters (price range, energy output)
- Related products ("customers also bought...")
- More inquiry_only projects (different scopes)
- Regional/language variants

---

## Summary

The seed populates a **realistic, representative mini-catalog** supporting all workflows:
- **Shop/cart flow** via direct_purchase items
- **Configuration flow** via configurable items
- **Lead/RFQ flow** via inquiry_only items

This allows **immediate, full-stack testing** (API, Storefront, Admin UX) without manual product creation.
