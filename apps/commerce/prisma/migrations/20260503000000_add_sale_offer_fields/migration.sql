-- Migration: add_sale_offer_fields
-- Adds offer/sale fields to products and product_variants.
-- All new columns are nullable or have defaults → no breaking change for existing rows.

-- Product-level: offer time window, label, countdown toggle
ALTER TABLE "products"
  ADD COLUMN "sale_starts_at"  TIMESTAMP(3),
  ADD COLUMN "sale_ends_at"    TIMESTAMP(3),
  ADD COLUMN "sale_label"      TEXT,
  ADD COLUMN "show_countdown"  BOOLEAN NOT NULL DEFAULT FALSE;

-- Variant-level: per-variant sale price
ALTER TABLE "product_variants"
  ADD COLUMN "sale_price_cents" INTEGER;
