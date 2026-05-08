-- Sprint 1.2/1.3/1.4 — alignement V1 :
--   1. Bdc.avance (montant + mode + note) — acompte client v1.0.15+
--   2. BdcItem.cmdStatus + cmdNote (workflow commande pour pièces) +
--      statusText (texte libre pour services simples)
--   3. Bdc.noteClientEval + noteClientFacture (migrer depuis Velo, qui
--      garde ses colonnes deprecated le temps de la transition)

-- 1. Avance (acompte) sur BDT
CREATE TYPE "avance_mode" AS ENUM ('COMPTANT', 'INTERAC', 'CARTES');

ALTER TABLE "bdc"
  ADD COLUMN IF NOT EXISTS "avance_montant" DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS "avance_mode"    "avance_mode",
  ADD COLUMN IF NOT EXISTS "avance_note"    TEXT;

-- 2. BdcItem : statut commande fournisseur pour pièces + notes
CREATE TYPE "bdc_piece_cmd_status" AS ENUM (
  'LISTEE', 'ESTIMEE', 'A_COMMANDER', 'EN_COMMANDE', 'RECU_PARTIEL', 'RECUE'
);

ALTER TABLE "bdc_item"
  ADD COLUMN IF NOT EXISTS "cmd_status"  "bdc_piece_cmd_status",
  ADD COLUMN IF NOT EXISTS "cmd_note"    TEXT,
  ADD COLUMN IF NOT EXISTS "status_text" TEXT;

-- Contrainte : cmdStatus uniquement si kind=PIECE (NULL pour SERVICE/FORFAIT)
ALTER TABLE "bdc_item"
  ADD CONSTRAINT "bdc_item_cmd_status_only_piece"
  CHECK ("cmd_status" IS NULL OR "kind" = 'PIECE');

-- 3. Notes client sur BDT (migration Velo → Bdc)
ALTER TABLE "bdc"
  ADD COLUMN IF NOT EXISTS "note_client_eval"    TEXT,
  ADD COLUMN IF NOT EXISTS "note_client_facture" TEXT;

-- Copie des notes existantes depuis Velo (uniquement BDC actifs : on ne
-- ré-écrit pas l'historique des BDT déjà archivés/facturés).
UPDATE "bdc" b
SET
  "note_client_eval"    = v."note_client_eval",
  "note_client_facture" = v."note_client_facture"
FROM "velo" v
WHERE b."velo_id" = v."id"
  AND b."archive_status" = 'ACTIF'
  AND (v."note_client_eval" IS NOT NULL OR v."note_client_facture" IS NOT NULL);

-- Note : Velo.note_client_eval / note_client_facture restent en place,
-- en lecture seule désormais (deprecated, à droper dans une migration
-- ultérieure une fois la transition validée).
