-- CreateEnum
CREATE TYPE "MarketSourceStatus" AS ENUM ('online', 'offline', 'unknown');

-- CreateEnum
CREATE TYPE "MarketSyncStatus" AS ENUM ('ok', 'needs_review', 'offline', 'price_changed');

-- AlterTable
ALTER TABLE "market_listings" ADD COLUMN     "availabilityNote" TEXT,
ADD COLUMN     "currentPrice" INTEGER,
ADD COLUMN     "lastAvailabilityCheckAt" TIMESTAMP(3),
ADD COLUMN     "lastKnownPrice" INTEGER,
ADD COLUMN     "priceChangeAmount" INTEGER,
ADD COLUMN     "priceChanged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sourceStatus" "MarketSourceStatus",
ADD COLUMN     "syncStatus" "MarketSyncStatus";

-- CreateIndex
CREATE INDEX "market_listings_syncStatus_idx" ON "market_listings"("syncStatus");

-- CreateIndex
CREATE INDEX "market_listings_sourceStatus_idx" ON "market_listings"("sourceStatus");
