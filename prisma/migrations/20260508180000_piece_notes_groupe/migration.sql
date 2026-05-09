-- Sprint 3.1 — Piece.notes + groupe
-- Champs marginaux V1 mais utiles pour catalogue propre :
--   - notes : note libre sur la pièce (V1 col AE)
--   - groupe : sous-classification au sein d'une catégorie (V1)

ALTER TABLE piece
  ADD COLUMN IF NOT EXISTS notes  TEXT,
  ADD COLUMN IF NOT EXISTS groupe TEXT;
