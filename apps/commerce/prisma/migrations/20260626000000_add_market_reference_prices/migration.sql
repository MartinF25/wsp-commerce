CREATE TABLE "market_reference_prices" (
  "id"          TEXT NOT NULL,
  "keyword"     TEXT NOT NULL,
  "productName" TEXT NOT NULL,
  "ek_eur"      INTEGER,
  "vk_eur"      INTEGER NOT NULL,
  "notes"       TEXT,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "market_reference_prices_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "market_reference_prices_keyword_idx" ON "market_reference_prices"("keyword");
