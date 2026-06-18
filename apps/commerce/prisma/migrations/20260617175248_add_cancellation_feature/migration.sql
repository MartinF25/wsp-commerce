/*
  Warnings:

  - You are about to drop the column `created_at` on the `product_images` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `product_variants` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CancellationStatus" AS ENUM ('widerruf_beantragt', 'widerruf_in_pruefung', 'widerruf_akzeptiert', 'widerruf_abgelehnt');

-- CreateEnum
CREATE TYPE "CancellationMode" AS ENUM ('always_submit', 'plausibility_check', 'auto_reject');

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_category_id_fkey";

-- DropIndex
DROP INDEX "categories_parent_id_idx";

-- DropIndex
DROP INDEX "product_images_product_id_idx";

-- DropIndex
DROP INDEX "product_variants_product_id_idx";

-- DropIndex
DROP INDEX "products_category_id_idx";

-- DropIndex
DROP INDEX "products_product_type_idx";

-- AlterTable
ALTER TABLE "blog_posts" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "product_images" DROP COLUMN "created_at";

-- AlterTable
ALTER TABLE "product_variants" DROP COLUMN "updated_at";

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "product_type" SET DEFAULT 'inquiry_only';

-- CreateTable
CREATE TABLE "cancellation_requests" (
    "id" TEXT NOT NULL,
    "order_reference" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "customer_first_name" TEXT NOT NULL,
    "customer_last_name" TEXT NOT NULL,
    "message" TEXT,
    "status" "CancellationStatus" NOT NULL DEFAULT 'widerruf_beantragt',
    "deadline_check_result" TEXT,
    "excluded_items_detected" BOOLEAN NOT NULL DEFAULT false,
    "customer_ip_hash" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'de',
    "admin_notes" TEXT,
    "customer_email_sent_at" TIMESTAMP(3),
    "admin_email_sent_at" TIMESTAMP(3),
    "rejection_email_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cancellation_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cancellation_logs" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "details" TEXT,
    "performed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cancellation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cancellation_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deadline_days" INTEGER NOT NULL DEFAULT 14,
    "delivery_buffer_days" INTEGER NOT NULL DEFAULT 2,
    "mode" "CancellationMode" NOT NULL DEFAULT 'always_submit',
    "admin_email" TEXT NOT NULL DEFAULT '',
    "show_footer_link" BOOLEAN NOT NULL DEFAULT true,
    "show_account_link" BOOLEAN NOT NULL DEFAULT true,
    "privacy_page_url" TEXT,
    "cancellation_policy_url" TEXT,
    "noindex" BOOLEAN NOT NULL DEFAULT false,
    "meta_title_de" TEXT,
    "meta_title_en" TEXT,
    "meta_title_es" TEXT,
    "meta_description_de" TEXT,
    "meta_description_en" TEXT,
    "meta_description_es" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cancellation_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cancellation_excluded_products" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_slug" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cancellation_excluded_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cancellation_excluded_categories" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "category_slug" TEXT NOT NULL,
    "category_name" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cancellation_excluded_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cancellation_requests_customer_email_idx" ON "cancellation_requests"("customer_email");

-- CreateIndex
CREATE INDEX "cancellation_requests_order_reference_idx" ON "cancellation_requests"("order_reference");

-- CreateIndex
CREATE INDEX "cancellation_requests_status_idx" ON "cancellation_requests"("status");

-- CreateIndex
CREATE INDEX "cancellation_requests_created_at_idx" ON "cancellation_requests"("created_at");

-- CreateIndex
CREATE INDEX "cancellation_logs_request_id_idx" ON "cancellation_logs"("request_id");

-- CreateIndex
CREATE UNIQUE INDEX "cancellation_excluded_products_product_id_key" ON "cancellation_excluded_products"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "cancellation_excluded_categories_category_id_key" ON "cancellation_excluded_categories"("category_id");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancellation_logs" ADD CONSTRAINT "cancellation_logs_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "cancellation_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
