import { put, del, type PutBlobResult } from '@vercel/blob';

/**
 * Helper Vercel Blob pour les photos BDT (Sprint 2.8).
 *
 * Le store Blob (Public) est créé côté Vercel projet `flex` et le token
 * `BLOB_READ_WRITE_TOKEN` est injecté automatiquement par l'intégration
 * Vercel-Blob.
 *
 * Convention de path : `workshops/{workshopId}/bdcs/{bdcId}/{uuid}.{ext}`.
 * Le UUID dans le nom empêche tout deviné de URL (les URLs publiques Blob
 * sont déjà préfixées d'un token random, mais le UUID ajoute une couche
 * pour ne pas exposer l'ID exact aux scrapers).
 */

const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

const ALLOWED_MIMES = Object.keys(MIME_EXT);

/** Taille max par image (10 MB — convention V1). */
export const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024;

export type UploadBdcPhotoInput = {
  workshopId: string;
  bdcId: string;
  file: File | Blob;
  mimeType: string;
  sizeBytes: number;
};

export type UploadBdcPhotoResult = {
  blobUrl: string;
  blobPath: string;
};

export function validatePhotoUpload({
  mimeType,
  sizeBytes,
}: {
  mimeType: string;
  sizeBytes: number;
}): { error?: string } {
  if (!ALLOWED_MIMES.includes(mimeType)) {
    return { error: `Type non supporté : ${mimeType}. Formats acceptés : JPG, PNG, WebP, HEIC.` };
  }
  if (sizeBytes > MAX_PHOTO_SIZE_BYTES) {
    const mb = (sizeBytes / 1024 / 1024).toFixed(1);
    return { error: `Fichier trop volumineux (${mb} Mo). Max 10 Mo.` };
  }
  if (sizeBytes <= 0) {
    return { error: 'Fichier vide.' };
  }
  return {};
}

export async function uploadBdcPhoto({
  workshopId,
  bdcId,
  file,
  mimeType,
}: UploadBdcPhotoInput): Promise<UploadBdcPhotoResult> {
  const ext = MIME_EXT[mimeType] ?? 'bin';
  const uuid = crypto.randomUUID();
  const path = `workshops/${workshopId}/bdcs/${bdcId}/${uuid}.${ext}`;

  const result: PutBlobResult = await put(path, file, {
    access: 'public',
    contentType: mimeType,
    // Pas d'addRandomSuffix : on a déjà notre UUID + le token random Vercel
    // sur le sous-domaine garantit l'unguessabilité.
    addRandomSuffix: false,
  });

  return {
    blobUrl: result.url,
    blobPath: path,
  };
}

export async function deleteBdcPhoto(blobPath: string): Promise<void> {
  await del(blobPath);
}
