-- AlterTable: add is_active to categories (description was added in previous migration)
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;

-- Remove columns that are no longer in the schema
ALTER TABLE "categories" DROP COLUMN IF EXISTS "created_at";
ALTER TABLE "categories" DROP COLUMN IF EXISTS "updated_at";
