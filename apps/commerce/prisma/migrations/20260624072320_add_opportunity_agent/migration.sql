-- CreateEnum
CREATE TYPE "MarketOpportunityStatus" AS ENUM ('pending', 'prepared', 'rejected');

-- AlterTable: Add Daily Opportunity Agent fields to market_listings
ALTER TABLE "market_listings"
  ADD COLUMN "purchasePrice"         INTEGER,
  ADD COLUMN "markupPercent"         INTEGER,
  ADD COLUMN "suggestedSellingPrice" INTEGER,
  ADD COLUMN "estimatedGrossProfit"  INTEGER,
  ADD COLUMN "pricingNote"           TEXT,
  ADD COLUMN "opportunityStatus"     "MarketOpportunityStatus",
  ADD COLUMN "dailyReportAt"         TIMESTAMP(3),
  ADD COLUMN "rejectedAt"            TIMESTAMP(3),
  ADD COLUMN "rejectedReason"        TEXT;

-- CreateIndex
CREATE INDEX "market_listings_opportunityStatus_idx" ON "market_listings"("opportunityStatus");
