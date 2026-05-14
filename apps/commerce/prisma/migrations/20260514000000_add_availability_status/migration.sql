-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('in_stock', 'out_of_stock', 'preorder', 'discontinued', 'on_request');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "availability_status" "AvailabilityStatus" NOT NULL DEFAULT 'in_stock';
