-- AlterTable: affiliate_clicks
-- Fügt source, affiliate_provider und device_category hinzu.
-- Alle Spalten nullable – kein Datenverlust bei bestehenden Datensätzen.

ALTER TABLE "affiliate_clicks" ADD COLUMN IF NOT EXISTS "source" TEXT;
ALTER TABLE "affiliate_clicks" ADD COLUMN IF NOT EXISTS "affiliate_provider" TEXT;
ALTER TABLE "affiliate_clicks" ADD COLUMN IF NOT EXISTS "device_category" TEXT;

-- Index für Auswertung nach Klickquelle
CREATE INDEX IF NOT EXISTS "affiliate_clicks_source_idx" ON "affiliate_clicks"("source");
