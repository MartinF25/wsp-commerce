CREATE TYPE "DealRecommendation" AS ENUM ('IMPORT', 'REVIEW', 'IGNORE');

CREATE TYPE "DealRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

CREATE TYPE "MarketProductCategory" AS ENUM ('solarzaun', 'solarspeicher', 'solaranlage', 'skywind', 'unknown');

ALTER TABLE "market_listings"
ADD COLUMN "dealScore" INTEGER,
ADD COLUMN "recommendation" "DealRecommendation",
ADD COLUMN "riskLevel" "DealRiskLevel",
ADD COLUMN "productCategory" "MarketProductCategory",
ADD COLUMN "estimatedMargin" INTEGER,
ADD COLUMN "seoPotential" INTEGER,
ADD COLUMN "aiComment" TEXT,
ADD COLUMN "analyzedAt" TIMESTAMP(3),
ADD COLUMN "productDraftId" TEXT,
ADD COLUMN "productCreatedAt" TIMESTAMP(3),
ADD COLUMN "productStatus" "ProductStatus";

CREATE INDEX "market_listings_dealScore_idx" ON "market_listings"("dealScore");
CREATE INDEX "market_listings_recommendation_idx" ON "market_listings"("recommendation");
CREATE INDEX "market_listings_analyzedAt_idx" ON "market_listings"("analyzedAt");
