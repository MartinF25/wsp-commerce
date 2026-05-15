-- CreateEnum
CREATE TYPE "LiveTickerStatus" AS ENUM ('draft', 'active', 'archived');

-- CreateEnum
CREATE TYPE "LiveTickerType" AS ENUM ('info', 'offer', 'availability', 'blog', 'product', 'warning');

-- CreateEnum
CREATE TYPE "LiveTickerScope" AS ENUM ('global', 'product', 'category', 'solution');

-- CreateTable
CREATE TABLE "live_ticker_messages" (
    "id" TEXT NOT NULL,
    "status" "LiveTickerStatus" NOT NULL DEFAULT 'draft',
    "type" "LiveTickerType" NOT NULL,
    "scope" "LiveTickerScope" NOT NULL DEFAULT 'global',
    "product_id" TEXT,
    "category_id" TEXT,
    "solution_slug" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "link_href" TEXT,
    "icon" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_ticker_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_ticker_message_translations" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "text" TEXT NOT NULL,
    "link_label" TEXT,

    CONSTRAINT "live_ticker_message_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "live_ticker_messages_status_scope_idx" ON "live_ticker_messages"("status", "scope");

-- CreateIndex
CREATE INDEX "live_ticker_messages_starts_at_ends_at_idx" ON "live_ticker_messages"("starts_at", "ends_at");

-- CreateIndex
CREATE UNIQUE INDEX "live_ticker_message_translations_message_id_locale_key" ON "live_ticker_message_translations"("message_id", "locale");

-- AddForeignKey
ALTER TABLE "live_ticker_messages" ADD CONSTRAINT "live_ticker_messages_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_ticker_messages" ADD CONSTRAINT "live_ticker_messages_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_ticker_message_translations" ADD CONSTRAINT "live_ticker_message_translations_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "live_ticker_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
