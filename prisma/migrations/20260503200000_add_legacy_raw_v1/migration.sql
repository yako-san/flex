-- Ajoute legacy_raw_v1 (JSONB nullable) sur client / velo / bdc.
-- Snapshot intégral de la ligne v1 d'origine pour traçabilité totale et
-- récupération de champs non mappés (googleResourceName, dateIn, dateOut...).

ALTER TABLE "client" ADD COLUMN "legacy_raw_v1" JSONB;
ALTER TABLE "velo" ADD COLUMN "legacy_raw_v1" JSONB;
ALTER TABLE "bdc" ADD COLUMN "legacy_raw_v1" JSONB;
