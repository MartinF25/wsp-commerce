-- Migration: Product Stickers & Labels
-- Adds Sticker, StickerTranslation, StickerRule, StickerProductOverride tables.

-- ─── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE "StickerStatus" AS ENUM ('active', 'inactive');

CREATE TYPE "StickerType" AS ENUM ('image', 'text', 'css_badge', 'tooltip', 'combined');

CREATE TYPE "StickerPosition" AS ENUM (
  'top_left', 'top_right', 'bottom_left', 'bottom_right', 'center', 'custom'
);

CREATE TYPE "StickerRuleType" AS ENUM (
  'all_products', 'category', 'price_range', 'availability', 'new_arrival'
);

-- ─── stickers ─────────────────────────────────────────────────────────────────

CREATE TABLE "stickers" (
  "id"              TEXT         NOT NULL,
  "name"            TEXT         NOT NULL,
  "status"          "StickerStatus"  NOT NULL DEFAULT 'inactive',
  "priority"        INTEGER      NOT NULL DEFAULT 0,
  "sort_order"      INTEGER      NOT NULL DEFAULT 0,
  "type"            "StickerType"    NOT NULL DEFAULT 'text',

  -- image
  "image_url"       TEXT,

  -- text styling
  "text_color"      TEXT,
  "bg_color"        TEXT,
  "border_color"    TEXT,
  "font_size"       TEXT,
  "font_bold"       BOOLEAN      NOT NULL DEFAULT false,
  "font_italic"     BOOLEAN      NOT NULL DEFAULT false,
  "border_radius"   TEXT,
  "padding"         TEXT,
  "opacity"         DECIMAL(3,2),
  "css_class"       TEXT,
  "custom_css"      TEXT,

  -- link
  "link_url"        TEXT,

  -- position
  "position"        "StickerPosition" NOT NULL DEFAULT 'top_left',
  "position_x"      INTEGER,
  "position_y"      INTEGER,

  -- size per page context (JSON object)
  "size_config"     JSONB        NOT NULL DEFAULT '{}',

  -- validity
  "valid_from"      TIMESTAMP(3),
  "valid_until"     TIMESTAMP(3),

  -- multi-store
  "store_id"        TEXT,

  -- customer groups (JSON array or null)
  "customer_groups" JSONB,

  -- conflict management
  "max_per_product" INTEGER      NOT NULL DEFAULT 3,
  "allow_override"  BOOLEAN      NOT NULL DEFAULT true,

  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP(3) NOT NULL,

  CONSTRAINT "stickers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "stickers_status_priority_idx"  ON "stickers"("status", "priority");
CREATE INDEX "stickers_valid_from_until_idx" ON "stickers"("valid_from", "valid_until");

-- ─── sticker_translations ─────────────────────────────────────────────────────

CREATE TABLE "sticker_translations" (
  "id"                 TEXT   NOT NULL,
  "sticker_id"         TEXT   NOT NULL,
  "locale"             "Locale" NOT NULL,
  "text"               TEXT,
  "tooltip"            TEXT,
  "tooltip_link_label" TEXT,
  "tooltip_link_url"   TEXT,
  "link_url"           TEXT,

  CONSTRAINT "sticker_translations_pkey"            PRIMARY KEY ("id"),
  CONSTRAINT "sticker_translations_sticker_id_fkey" FOREIGN KEY ("sticker_id")
    REFERENCES "stickers"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "sticker_translations_sticker_id_locale_key"
  ON "sticker_translations"("sticker_id", "locale");

-- ─── sticker_rules ────────────────────────────────────────────────────────────

CREATE TABLE "sticker_rules" (
  "id"                  TEXT   NOT NULL,
  "sticker_id"          TEXT   NOT NULL,
  "rule_type"           "StickerRuleType" NOT NULL,
  "category_id"         TEXT,
  "price_min_cents"     INTEGER,
  "price_max_cents"     INTEGER,
  "availability_status" TEXT,
  "new_arrival_days"    INTEGER,

  CONSTRAINT "sticker_rules_pkey"            PRIMARY KEY ("id"),
  CONSTRAINT "sticker_rules_sticker_id_fkey" FOREIGN KEY ("sticker_id")
    REFERENCES "stickers"("id") ON DELETE CASCADE
);

-- ─── sticker_product_overrides ────────────────────────────────────────────────

CREATE TABLE "sticker_product_overrides" (
  "id"         TEXT    NOT NULL,
  "sticker_id" TEXT    NOT NULL,
  "product_id" TEXT    NOT NULL,
  "enabled"    BOOLEAN NOT NULL DEFAULT true,
  "excluded"   BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT "sticker_product_overrides_pkey"            PRIMARY KEY ("id"),
  CONSTRAINT "sticker_product_overrides_sticker_id_fkey" FOREIGN KEY ("sticker_id")
    REFERENCES "stickers"("id") ON DELETE CASCADE,
  CONSTRAINT "sticker_product_overrides_product_id_fkey" FOREIGN KEY ("product_id")
    REFERENCES "products"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "sticker_product_overrides_sticker_id_product_id_key"
  ON "sticker_product_overrides"("sticker_id", "product_id");
