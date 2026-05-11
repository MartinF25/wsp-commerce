-- Add missing SEO columns to categories
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "meta_title" TEXT;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "meta_description" TEXT;
