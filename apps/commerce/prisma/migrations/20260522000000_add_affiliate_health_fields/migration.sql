-- Migration: affiliate_health_fields
-- Fügt drei optionale Felder zum Product-Modell hinzu für n8n Health-Checks.
-- Alle Felder nullable → keine Datenmigration bestehender Zeilen nötig.

ALTER TABLE "products" ADD COLUMN "affiliate_last_checked_at" TIMESTAMP(3);
ALTER TABLE "products" ADD COLUMN "affiliate_health_status"   TEXT;
ALTER TABLE "products" ADD COLUMN "affiliate_health_message"  TEXT;
