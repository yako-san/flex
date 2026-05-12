-- Sprint 2.8 — Photos attachées aux BDT (Vercel Blob storage).
--
-- Crée la table bdc_photo + enum bdc_photo_kind. Les fichiers eux-mêmes
-- vivent sur Vercel Blob ; cette table stocke uniquement les URLs et
-- métadonnées.
--
-- Cascade onDelete : suppression d'un BDT ou d'un workshop supprime
-- automatiquement les lignes bdc_photo associées (mais PAS les fichiers
-- Blob — à nettoyer via job de purge périodique sur deletedAt is not null
-- depuis > X jours).
--
-- Soft delete via deletedAt : la suppression côté UI marque deletedAt
-- au lieu de DELETE direct, permettant rollback. Le fichier Blob est
-- conservé jusqu'au purge job.
--
-- ⚠ À APPLIQUER sur Neon flex-prod / branche main (PAS flex-v2/production).
-- L'app Vercel suit flex-prod. Si appliquée sur le mauvais projet,
-- l'app crashera avec "relation bdc_photo does not exist".

CREATE TYPE "bdc_photo_kind" AS ENUM ('AVANT', 'APRES', 'DEGAT', 'SERIE', 'AUTRE');

CREATE TABLE "bdc_photo" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "bdc_id" TEXT NOT NULL,
    "blob_url" TEXT NOT NULL,
    "blob_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "caption" TEXT,
    "kind" "bdc_photo_kind" NOT NULL DEFAULT 'AUTRE',
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by_id" TEXT,

    CONSTRAINT "bdc_photo_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bdc_photo_workshop_id_deleted_at_idx" ON "bdc_photo"("workshop_id", "deleted_at");
CREATE INDEX "bdc_photo_bdc_id_position_idx" ON "bdc_photo"("bdc_id", "position");

ALTER TABLE "bdc_photo" ADD CONSTRAINT "bdc_photo_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bdc_photo" ADD CONSTRAINT "bdc_photo_bdc_id_fkey" FOREIGN KEY ("bdc_id") REFERENCES "bdc"("id") ON DELETE CASCADE ON UPDATE CASCADE;
