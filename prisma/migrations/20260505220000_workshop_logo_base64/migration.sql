-- Logo en base64 (data URL ou raw base64) sur Workshop.
-- Utilisé par les PDFs et le favicon dynamique.

ALTER TABLE "workshop" ADD COLUMN "logo_base64" TEXT;
