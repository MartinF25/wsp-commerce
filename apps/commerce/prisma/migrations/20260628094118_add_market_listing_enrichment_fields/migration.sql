-- AlterTable
ALTER TABLE "market_listings" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "dataCompletenessScore" INTEGER,
ADD COLUMN     "enrichedAt" TIMESTAMP(3),
ADD COLUMN     "enrichmentConfidence" DOUBLE PRECISION,
ADD COLUMN     "enrichmentMetadata" JSONB,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "productSeries" TEXT,
ADD COLUMN     "productType" TEXT,
ADD COLUMN     "subcategory" TEXT;

-- CreateIndex
CREATE INDEX "market_listings_enrichedAt_idx" ON "market_listings"("enrichedAt");

-- CreateIndex
CREATE INDEX "market_listings_dataCompletenessScore_idx" ON "market_listings"("dataCompletenessScore");

-- CreateIndex
CREATE INDEX "market_listings_brand_idx" ON "market_listings"("brand");
