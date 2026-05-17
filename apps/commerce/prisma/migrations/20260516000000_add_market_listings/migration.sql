-- CreateTable
CREATE TABLE "MarketListing" (
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

    CONSTRAINT "MarketListing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketListing_ad_id_key" ON "MarketListing"("ad_id");

-- CreateIndex
CREATE INDEX "MarketListing_scraped_at_idx" ON "MarketListing"("scraped_at");

-- CreateIndex
CREATE INDEX "MarketListing_source_keyword_idx" ON "MarketListing"("source", "keyword");
