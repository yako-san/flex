-- Étend legacy_raw_v1 (JSONB) à toutes les tables d'entités v1.
-- + legacy_v1_extras sur workshop pour les données non mappées (factures journal,
--   counters historiques, etc.)

ALTER TABLE "marque" ADD COLUMN "legacy_raw_v1" JSONB;
ALTER TABLE "service" ADD COLUMN "legacy_raw_v1" JSONB;
ALTER TABLE "piece" ADD COLUMN "legacy_raw_v1" JSONB;
ALTER TABLE "forfait" ADD COLUMN "legacy_raw_v1" JSONB;
ALTER TABLE "vente_directe" ADD COLUMN "legacy_raw_v1" JSONB;
ALTER TABLE "po" ADD COLUMN "legacy_raw_v1" JSONB;
ALTER TABLE "equipe_member" ADD COLUMN "legacy_raw_v1" JSONB;

ALTER TABLE "workshop" ADD COLUMN "legacy_v1_extras" JSONB;
