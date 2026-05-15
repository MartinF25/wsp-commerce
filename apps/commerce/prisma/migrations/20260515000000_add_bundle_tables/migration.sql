-- CreateEnum
CREATE TYPE "BundleStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "BundleDiscountType" AS ENUM ('none', 'percentage', 'fixed', 'per_item');

-- CreateEnum
CREATE TYPE "BundleDiscountMode" AS ENUM ('all_items', 'min_count', 'any_item');

-- CreateEnum
CREATE TYPE "BundleDisplayMode" AS ENUM ('card', 'list', 'slider', 'tabs');

-- CreateTable
CREATE TABLE "bundles" (
    "id" TEXT NOT NULL,
    "status" "BundleStatus" NOT NULL DEFAULT 'inactive',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "image_url" TEXT,
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "store_id" TEXT,
    "discount_type" "BundleDiscountType" NOT NULL DEFAULT 'none',
    "discount_percent" DECIMAL(5,2),
    "discount_cents" INTEGER,
    "discount_mode" "BundleDiscountMode" NOT NULL DEFAULT 'all_items',
    "min_items_for_discount" INTEGER NOT NULL DEFAULT 1,
    "valid_from_discount" TIMESTAMP(3),
    "valid_until_discount" TIMESTAMP(3),
    "display_mode" "BundleDisplayMode" NOT NULL DEFAULT 'card',
    "tab_group" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bundles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bundle_translations" (
    "id" TEXT NOT NULL,
    "bundle_id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "tab_name" TEXT,

    CONSTRAINT "bundle_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bundle_items" (
    "id" TEXT NOT NULL,
    "bundle_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "discount_percent" DECIMAL(5,2),
    "discount_cents" INTEGER,

    CONSTRAINT "bundle_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bundle_product_assignments" (
    "bundle_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,

    CONSTRAINT "bundle_product_assignments_pkey" PRIMARY KEY ("bundle_id","product_id")
);

-- CreateTable
CREATE TABLE "bundle_category_assignments" (
    "bundle_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,

    CONSTRAINT "bundle_category_assignments_pkey" PRIMARY KEY ("bundle_id","category_id")
);

-- CreateIndex
CREATE INDEX "bundles_status_sort_order_idx" ON "bundles"("status", "sort_order");

-- CreateIndex
CREATE INDEX "bundles_valid_from_valid_until_idx" ON "bundles"("valid_from", "valid_until");

-- CreateIndex
CREATE UNIQUE INDEX "bundle_translations_bundle_id_locale_key" ON "bundle_translations"("bundle_id", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "bundle_items_bundle_id_product_id_key" ON "bundle_items"("bundle_id", "product_id");

-- AddForeignKey
ALTER TABLE "bundle_translations" ADD CONSTRAINT "bundle_translations_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "bundles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "bundles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_product_assignments" ADD CONSTRAINT "bundle_product_assignments_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "bundles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_product_assignments" ADD CONSTRAINT "bundle_product_assignments_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_category_assignments" ADD CONSTRAINT "bundle_category_assignments_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "bundles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_category_assignments" ADD CONSTRAINT "bundle_category_assignments_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
