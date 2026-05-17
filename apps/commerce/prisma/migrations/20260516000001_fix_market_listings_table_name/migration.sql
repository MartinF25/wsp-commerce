-- Fix: drop incorrectly named table (PascalCase) and create with correct snake_case name
DROP TABLE IF EXISTS "MarketListing";

-- CreateTable
CREATE TABLE "market_listings" (
    "id" TEXT NOT NULL,
    "ad_id" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'kleinanzeigen',
    "keyword" TEXT NOT NULL DEFAULT 'skywind',
    "title" TEXT NOT NULL,
    "price_raw" TEXT,
    "price_cents" INTEGER,
    "price_negotiable" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "location" TEXT,
    "plz" TEXT,
    "listing_url" TEXT,
    "image_url" TEXT,
    "shipping" TEXT,
    "listed_at" TIMESTAMP(3),
    "scraped_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_listings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "market_listings_ad_id_key" ON "market_listings"("ad_id");

-- CreateIndex
CREATE INDEX "market_listings_scraped_at_idx" ON "market_listings"("scraped_at");

-- CreateIndex
CREATE INDEX "market_listings_source_keyword_idx" ON "market_listings"("source", "keyword");
