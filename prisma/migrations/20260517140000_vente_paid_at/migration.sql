-- Sprint Phase D · Cluster 4 item m — Marquer vente directe comme payée.
--
-- Ajoute la colonne paid_at sur vente_directe pour distinguer trois états :
--   1. brouillon          → factureNumero = null
--   2. facturée pas payée → factureNumero != null, paidAt = null
--   3. payée              → factureNumero != null, paidAt != null
--
-- Une vente facturée mais pas payée ne peut pas être archivée (soft-delete).
-- Une vente payée peut être archivée même après facturation.
--
-- Référence V1 : col P du sheet `_VENTES_` (PR V1 #9).
--
-- NB: l'app remplit paidAt avec NOW() au passage du toggle. Pas de backfill
-- automatique pour les ventes pré-existantes — elles restent en état 2
-- jusqu'à toggle manuel.

ALTER TABLE "vente_directe" ADD COLUMN "paid_at" TIMESTAMP(3);
