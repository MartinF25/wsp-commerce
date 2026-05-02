-- AlterTable: make alt column nullable in product_images
ALTER TABLE "product_images" ALTER COLUMN "alt" DROP NOT NULL;
