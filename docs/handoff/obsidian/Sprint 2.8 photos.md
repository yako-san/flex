# Sprint 2.8 — photos BDT Vercel Blob

> **Statut : PR #18 ouverte, attend l'application SQL sur Neon `flex-prod`.**

## Décisions d'archi

- Photos rattachées au **BDT** (`BdcPhoto`), pas au vélo. Voir [[Hindsight]]
  section « BdcPhoto plutôt que VeloPhoto ».
- Stockage Vercel Blob, store public déjà créé. Token `BLOB_READ_WRITE_TOKEN`
  injecté côté Vercel.
- Path Blob : `workshops/{wid}/bdcs/{bid}/{uuid}.{ext}` (UUID pour
  unguessabilité supplémentaire en plus du token random Vercel sur le sous-domaine).
- MIME whitelist : JPG, PNG, WebP, HEIC, HEIF. Max **10 Mo** (convention V1).
- Soft delete via `deletedAt` (les fichiers Blob restent jusqu'à un job de purge
  périodique).

## Modèle Prisma

```prisma
model BdcPhoto {
  id          String       @id
  workshopId  String
  bdcId       String
  blobUrl     String
  blobPath    String
  mimeType    String
  sizeBytes   Int
  width       Int?
  height      Int?
  caption     String?
  kind        BdcPhotoKind @default(AUTRE)
  position    Int          @default(0)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  deletedAt   DateTime?
  createdById String?

  workshop Workshop @relation(...)
  bdc      Bdc      @relation(...)

  @@index([workshopId, deletedAt])
  @@index([bdcId, position])
}

enum BdcPhotoKind { AVANT APRES DEGAT SERIE AUTRE }
```

## Migration SQL à appliquer

Fichier : `prisma/migrations/20260512170000_bdc_photo/migration.sql`

```sql
CREATE TYPE "bdc_photo_kind" AS ENUM ('AVANT', 'APRES', 'DEGAT', 'SERIE', 'AUTRE');
CREATE TABLE "bdc_photo" (
  ...
);
CREATE INDEX "bdc_photo_workshop_id_deleted_at_idx" ON "bdc_photo"(...);
CREATE INDEX "bdc_photo_bdc_id_position_idx" ON "bdc_photo"(...);
ALTER TABLE "bdc_photo" ADD CONSTRAINT "bdc_photo_workshop_id_fkey" FOREIGN KEY ...;
ALTER TABLE "bdc_photo" ADD CONSTRAINT "bdc_photo_bdc_id_fkey" FOREIGN KEY ...;
```

**Apply sur Neon flex-prod / branche main** (PAS `flex-v2`). Voir [[Vercel et Neon]].

## Lib helper (déjà dans PR #18)

`src/lib/storage/blob.ts` — `uploadBdcPhoto`, `deleteBdcPhoto`, `validatePhotoUpload`.

## Suite (après merge PR #18 + SQL apply)

1. Server Action `uploadBdcPhotoAction(bdcId, file, kind?)` — validate + put
   Blob + create row
2. Server Action `deleteBdcPhotoAction(photoId)` — del Blob + soft delete row
3. Server Action `reorderBdcPhotosAction(photoIds[])` — set position
4. Composant `<BdcPhotoUpload>` (drag & drop multi-fichier + preview avant upload)
5. Composant `<BdcPhotoGallery>` (grille thumbnails responsive + lightbox)
6. Intégration dans [[BDT detail layout]] :
   - Option A : onglet « PHOTOS » dans pills CLIENT/VÉLO de BdtSidecard
   - Option B : section dédiée en bas de col gauche
   - Option C : nouveau bloc sous Services/Pièces
   → À décider avec yako-san avant de coder.

## Liens

- [[Vercel et Neon]] — application SQL
- [[Workflow git]] — PR #18 attend SQL avant merge
- [[Reste à faire]]
