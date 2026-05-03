-- Drop unique constraint on bdc(velo_id).
-- En v1 un vélo peut avoir plusieurs BDC dans son historique : un actif puis
-- une copie archivée (cycle de vie workflow). En v2 on conserve cette
-- multiplicité pour préserver l'historique facturation.

DROP INDEX "bdc_velo_id_key";
CREATE INDEX "bdc_velo_id_idx" ON "bdc"("velo_id");
