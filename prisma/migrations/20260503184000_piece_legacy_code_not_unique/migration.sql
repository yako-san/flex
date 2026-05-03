-- Drop unique constraint on (workshop_id, legacy_code) for Piece :
-- la dédup v1→v2 produit légitimement N pièces v2 pour un même pieceId v1
-- (cf src/lib/import/dedupe-piece.ts). La traçabilité 1:N est assurée par
-- la table legacy_id_mapping.

DROP INDEX "piece_workshop_id_legacy_code_key";
CREATE INDEX "piece_workshop_id_legacy_code_idx" ON "piece"("workshop_id", "legacy_code");
