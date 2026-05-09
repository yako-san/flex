-- Sprint 2.10 — drop Velo.noteClientEval/Facture deprecated.
--
-- Sprint 1.4 avait déplacé ces champs vers Bdc.noteClientEval/Facture
-- avec une copie pour les BDT archiveStatus='ACTIF' uniquement. Ici on
-- complète la copie pour les BDT archivés (le BDT le plus récent par
-- vélo qui n'a pas encore de note migrée) avant de drop les colonnes Velo.
--
-- Pour chaque vélo qui a encore des notes sur Velo et au moins un BDT
-- sans note client, on copie sur le BDT le plus récent.

WITH ranked AS (
  SELECT
    b.id AS bdc_id,
    b.velo_id,
    v.note_client_eval AS v_eval,
    v.note_client_facture AS v_facture,
    ROW_NUMBER() OVER (PARTITION BY b.velo_id ORDER BY b.created_at DESC) AS rn
  FROM bdc b
  JOIN velo v ON v.id = b.velo_id
  WHERE b.deleted_at IS NULL
    AND b.note_client_eval IS NULL
    AND b.note_client_facture IS NULL
    AND (v.note_client_eval IS NOT NULL OR v.note_client_facture IS NOT NULL)
)
UPDATE bdc b
SET
  note_client_eval = ranked.v_eval,
  note_client_facture = ranked.v_facture
FROM ranked
WHERE b.id = ranked.bdc_id
  AND ranked.rn = 1;

-- Drop des colonnes Velo (toute donnée non migrée est perdue, mais elle
-- reste dans Workshop.legacyV1Extras / Velo.legacyRawV1 pour audit).
ALTER TABLE velo
  DROP COLUMN IF EXISTS note_client_eval,
  DROP COLUMN IF EXISTS note_client_facture;
