-- AlterTable: Payment Links zu Produkten hinzufügen
-- paypal_url: PayPal.me oder PayPal Payment Link
-- stripe_url: Stripe Payment Link (buy.stripe.com/...)
ALTER TABLE "products" ADD COLUMN "paypal_url" TEXT;
ALTER TABLE "products" ADD COLUMN "stripe_url" TEXT;
