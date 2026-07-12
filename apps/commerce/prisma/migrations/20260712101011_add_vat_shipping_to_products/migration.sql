-- AlterTable
ALTER TABLE "products" ADD COLUMN     "shipping_cents" INTEGER,
ADD COLUMN     "shipping_type" TEXT NOT NULL DEFAULT 'freight',
ADD COLUMN     "vat_rate" INTEGER NOT NULL DEFAULT 19;
