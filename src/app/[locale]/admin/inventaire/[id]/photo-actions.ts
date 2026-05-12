'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { generateId } from '@/lib/ids/generate-id';
import {
  deleteBdcPhoto,
  uploadBdcPhoto,
  validatePhotoUpload,
} from '@/lib/storage/blob';

// Sprint 2.8 — Server Actions pour les photos attachées aux BDT.
// Storage Vercel Blob (path stable workshops/{wid}/bdcs/{bid}/{uuid}.{ext}).

type UploadResult =
  | { ok: true; photoId: string }
  | { ok: false; error: string };

const PHOTO_KINDS = ['AVANT', 'APRES', 'DEGAT', 'SERIE', 'AUTRE'] as const;
type PhotoKind = (typeof PHOTO_KINDS)[number];

/** Upload une photo BDT depuis un FormData (file + bdcId + kind?). */
export async function uploadBdcPhotoAction(
  formData: FormData,
): Promise<UploadResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { ok: false, error: 'Aucun workshop actif' };

  const bdcId = String(formData.get('bdcId') ?? '').trim();
  const file = formData.get('file');
  const kindRaw = String(formData.get('kind') ?? 'AUTRE').toUpperCase();
  const captionRaw = formData.get('caption');

  if (!bdcId) return { ok: false, error: 'bdcId requis' };
  if (!(file instanceof File)) return { ok: false, error: 'Fichier manquant' };

  const kind: PhotoKind = PHOTO_KINDS.includes(kindRaw as PhotoKind)
    ? (kindRaw as PhotoKind)
    : 'AUTRE';
  const caption = typeof captionRaw === 'string' && captionRaw.trim() !== '' ? captionRaw.trim() : null;

  const validation = validatePhotoUpload({
    mimeType: file.type,
    sizeBytes: file.size,
  });
  if (validation.error) return { ok: false, error: validation.error };

  const bdc = await prisma.bdc.findFirst({
    where: { id: bdcId, workshopId: workshop.id, deletedAt: null },
    select: { id: true },
  });
  if (!bdc) return { ok: false, error: 'BDT introuvable' };

  let uploadResult: Awaited<ReturnType<typeof uploadBdcPhoto>>;
  try {
    uploadResult = await uploadBdcPhoto({
      workshopId: workshop.id,
      bdcId,
      file,
      mimeType: file.type,
      sizeBytes: file.size,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur upload Blob';
    return { ok: false, error: msg };
  }

  // Position : à la fin de la galerie existante
  const last = await prisma.bdcPhoto.findFirst({
    where: { bdcId, deletedAt: null },
    orderBy: { position: 'desc' },
    select: { position: true },
  });
  const position = (last?.position ?? -1) + 1;

  const photoId = generateId('bphoto');
  await prisma.bdcPhoto.create({
    data: {
      id: photoId,
      workshopId: workshop.id,
      bdcId,
      blobUrl: uploadResult.blobUrl,
      blobPath: uploadResult.blobPath,
      mimeType: file.type,
      sizeBytes: file.size,
      caption,
      kind,
      position,
      createdById: userId,
    },
  });

  revalidatePath(`/[locale]/admin/inventaire/${bdcId}`, 'page');
  return { ok: true, photoId };
}

/** Soft-delete une photo BDT (la row est marquée deletedAt, le Blob reste
 *  jusqu'au job de purge périodique).
 *
 *  Note : `force=true` (option future) supprime aussi du Blob immédiatement —
 *  utile si yako-san veut un vrai « définitif ». Pas exposé dans l'UI pour
 *  l'instant (filet de sécurité).
 */
export async function deleteBdcPhotoAction(
  photoId: string,
  options?: { hardDelete?: boolean },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { ok: false, error: 'Aucun workshop actif' };

  const photo = await prisma.bdcPhoto.findFirst({
    where: { id: photoId, workshopId: workshop.id, deletedAt: null },
    select: { id: true, bdcId: true, blobPath: true },
  });
  if (!photo) return { ok: false, error: 'Photo introuvable' };

  if (options?.hardDelete) {
    try {
      await deleteBdcPhoto(photo.blobPath);
    } catch (e) {
      // Si le Blob a déjà été supprimé manuellement, on ignore — on continue
      // avec la suppression DB. Logger seulement.
      console.warn('Vercel Blob delete failed (non-blocking):', e);
    }
    await prisma.bdcPhoto.delete({ where: { id: photoId } });
  } else {
    await prisma.bdcPhoto.update({
      where: { id: photoId },
      data: { deletedAt: new Date() },
    });
  }

  revalidatePath(`/[locale]/admin/inventaire/${photo.bdcId}`, 'page');
  return { ok: true };
}

/** Réordonne les photos d'un BDT — accepte la liste d'IDs dans l'ordre voulu.
 *  Met à jour `position = i` pour chaque ID, dans une transaction. */
export async function reorderBdcPhotosAction(
  bdcId: string,
  photoIds: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { ok: false, error: 'Aucun workshop actif' };

  const bdc = await prisma.bdc.findFirst({
    where: { id: bdcId, workshopId: workshop.id, deletedAt: null },
    select: { id: true },
  });
  if (!bdc) return { ok: false, error: 'BDT introuvable' };

  await prisma.$transaction(
    photoIds.map((id, position) =>
      prisma.bdcPhoto.updateMany({
        where: { id, bdcId, workshopId: workshop.id },
        data: { position },
      }),
    ),
  );

  revalidatePath(`/[locale]/admin/inventaire/${bdcId}`, 'page');
  return { ok: true };
}

/** Met à jour la légende ou le kind d'une photo. */
export async function patchBdcPhotoAction(
  photoId: string,
  updates: { caption?: string | null; kind?: PhotoKind },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { ok: false, error: 'Aucun workshop actif' };

  const photo = await prisma.bdcPhoto.findFirst({
    where: { id: photoId, workshopId: workshop.id, deletedAt: null },
    select: { id: true, bdcId: true },
  });
  if (!photo) return { ok: false, error: 'Photo introuvable' };

  const data: { caption?: string | null; kind?: PhotoKind } = {};
  if ('caption' in updates) data.caption = updates.caption;
  if (updates.kind && PHOTO_KINDS.includes(updates.kind)) data.kind = updates.kind;

  await prisma.bdcPhoto.update({
    where: { id: photoId },
    data,
  });

  revalidatePath(`/[locale]/admin/inventaire/${photo.bdcId}`, 'page');
  return { ok: true };
}
