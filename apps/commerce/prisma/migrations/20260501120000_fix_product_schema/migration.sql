-- ── Neue Enums ──────────────────────────────────────────────────────────────────

DO $$ BEGIN
    CREATE TYPE "Locale" AS ENUM ('de', 'en', 'es');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "BlogStatus" AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Products: veraltete Felder entfernen, category_id nullable machen ───────────

ALTER TABLE "products" DROP COLUMN IF EXISTS "name";
ALTER TABLE "products" DROP COLUMN IF EXISTS "description";
ALTER TABLE "products" DROP COLUMN IF EXISTS "price_cents_min_display";
ALTER TABLE "products" ALTER COLUMN "category_id" DROP NOT NULL;

-- ── Product Variants: altes name-Feld entfernen, neue Felder + Fixes ────────────

ALTER TABLE "product_variants" DROP COLUMN IF EXISTS "name";

-- updated_at hat kein DEFAULT → automatischen Default setzen damit Prisma es ignorieren kann
ALTER TABLE "product_variants" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- stock_quantity: NULL → 0, dann NOT NULL mit Default
UPDATE "product_variants" SET "stock_quantity" = 0 WHERE "stock_quantity" IS NULL;
ALTER TABLE "product_variants" ALTER COLUMN "stock_quantity" SET NOT NULL;
ALTER TABLE "product_variants" ALTER COLUMN "stock_quantity" SET DEFAULT 0;

-- attributes: NULL → '{}', dann NOT NULL mit Default
UPDATE "product_variants" SET "attributes" = '{}' WHERE "attributes" IS NULL;
ALTER TABLE "product_variants" ALTER COLUMN "attributes" SET NOT NULL;
ALTER TABLE "product_variants" ALTER COLUMN "attributes" SET DEFAULT '{}';

-- neue Felder
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "is_active"   BOOLEAN        NOT NULL DEFAULT true;
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "weight_kg"   DOUBLE PRECISION;
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "dimensions"  JSONB;

-- ── Neue Tabelle: product_translations ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "product_translations" (
    "id"                TEXT    NOT NULL,
    "product_id"        TEXT    NOT NULL,
    "locale"            "Locale" NOT NULL,
    "name"              TEXT    NOT NULL,
    "short_description" TEXT,
    "description"       TEXT,
    "delivery_note"     TEXT,
    "features"          JSONB   NOT NULL DEFAULT '[]',
    "meta_title"        TEXT,
    "meta_description"  TEXT,
    "mounting_note"     TEXT,
    "project_note"      TEXT,
    CONSTRAINT "product_translations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "product_translations_product_id_locale_key"
    ON "product_translations"("product_id", "locale");

ALTER TABLE "product_translations"
    DROP CONSTRAINT IF EXISTS "product_translations_product_id_fkey";
ALTER TABLE "product_translations"
    ADD CONSTRAINT "product_translations_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Neue Tabelle: product_variant_translations ──────────────────────────────────

CREATE TABLE IF NOT EXISTS "product_variant_translations" (
    "id"         TEXT     NOT NULL,
    "variant_id" TEXT     NOT NULL,
    "locale"     "Locale" NOT NULL,
    "name"       TEXT     NOT NULL,
    CONSTRAINT "product_variant_translations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "product_variant_translations_variant_id_locale_key"
    ON "product_variant_translations"("variant_id", "locale");

ALTER TABLE "product_variant_translations"
    DROP CONSTRAINT IF EXISTS "product_variant_translations_variant_id_fkey";
ALTER TABLE "product_variant_translations"
    ADD CONSTRAINT "product_variant_translations_variant_id_fkey"
    FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Neue Tabelle: product_documents ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "product_documents" (
    "id"         TEXT    NOT NULL,
    "product_id" TEXT    NOT NULL,
    "name"       TEXT    NOT NULL,
    "url"        TEXT    NOT NULL,
    "type"       TEXT    NOT NULL DEFAULT 'datasheet',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "product_documents_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "product_documents"
    DROP CONSTRAINT IF EXISTS "product_documents_product_id_fkey";
ALTER TABLE "product_documents"
    ADD CONSTRAINT "product_documents_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Neue Tabelle: blog_posts ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "blog_posts" (
    "id"           TEXT          NOT NULL,
    "slug"         TEXT          NOT NULL,
    "title"        TEXT          NOT NULL,
    "excerpt"      TEXT,
    "content"      TEXT          NOT NULL,
    "cover_image"  TEXT,
    "author"       TEXT,
    "tags"         TEXT[]        NOT NULL DEFAULT ARRAY[]::TEXT[],
    "status"       "BlogStatus"  NOT NULL DEFAULT 'draft',
    "published_at" TIMESTAMP(3),
    "created_at"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "blog_posts_slug_key" ON "blog_posts"("slug");
