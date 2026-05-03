-- Drop unique constraint on piece(workshop_id, sku).
-- Le SKU est une référence fournisseur. La v1 contient des SKUs partagés
-- légitimement entre items distincts (ex 26-057 pour Babac Fourche +
-- Entretoise dans le dump yako-cyclo). On accepte ces doublons et garde
-- un index non-unique pour les recherches.

DROP INDEX "piece_workshop_id_sku_key";
CREATE INDEX "piece_workshop_id_sku_idx" ON "piece"("workshop_id", "sku");
