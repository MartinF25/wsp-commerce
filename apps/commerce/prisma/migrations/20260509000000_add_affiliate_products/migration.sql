-- Migration: Add affiliate_external product type and affiliate click tracking
-- Scope: Task 1 – Data model only. No UI, no checkout, no tracking UI.

-- 1. Extend ProductType enum with affiliate_external value
ALTER TYPE "ProductType" ADD VALUE IF NOT EXISTS 'affiliate_external';

-- 2. Add affiliate fields to products table
--    All nullable – existing products are unaffected.
--    affiliate_enabled defaults to false – no accidental live affiliate buttons.
ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "affiliate_provider"     TEXT,
  ADD COLUMN IF NOT EXISTS "affiliate_url"          TEXT,
  ADD COLUMN IF NOT EXISTS "affiliate_asin"         TEXT,
  ADD COLUMN IF NOT EXISTS "affiliate_button_label" TEXT,
  ADD COLUMN IF NOT EXISTS "affiliate_disclosure"   TEXT,
  ADD COLUMN IF NOT EXISTS "affiliate_enabled"      BOOLEAN NOT NULL DEFAULT false;

-- 3. Create affiliate_clicks table
--    Intentionally sparse: no IP address, no user agent, no personal data.
CREATE TABLE IF NOT EXISTS "affiliate_clicks" (
  "id"            TEXT NOT NULL,
  "product_id"    TEXT NOT NULL,
  "clicked_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "referrer_path" TEXT,
  "locale"        TEXT,

  CONSTRAINT "affiliate_clicks_pkey" PRIMARY KEY ("id")
);

-- 4. Foreign key: affiliate_clicks → products (cascade delete)
ALTER TABLE "affiliate_clicks"
  ADD CONSTRAINT "affiliate_clicks_product_id_fkey"
  FOREIGN KEY ("product_id")
  REFERENCES "products"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- 5. Indexes for stats queries (by product, by time range)
CREATE INDEX IF NOT EXISTS "affiliate_clicks_product_id_idx"
  ON "affiliate_clicks"("product_id");

CREATE INDEX IF NOT EXISTS "affiliate_clicks_clicked_at_idx"
  ON "affiliate_clicks"("clicked_at");
