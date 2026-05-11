-- Add missing columns to categories that were in schema but never migrated
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "image_url" TEXT;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "meta_title" TEXT;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "meta_description" TEXT;
