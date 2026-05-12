import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mocks injectés AVANT l'import des Server Actions.
// Vitest hoist les vi.mock(...) automatiquement.

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    bdc: { findFirst: vi.fn() },
    bdcPhoto: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/workshop', () => ({
  getActiveWorkshop: vi.fn(),
}));

vi.mock('@/lib/ids/generate-id', () => ({
  generateId: vi.fn(() => 'bphoto_FAKE_ULID'),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// `validatePhotoUpload` reste la vraie (fonction pure) ; on mocke seulement
// les helpers qui touchent Vercel Blob.
vi.mock('@/lib/storage/blob', async () => {
  const actual = await vi.importActual<typeof import('@/lib/storage/blob')>(
    '@/lib/storage/blob',
  );
  return {
    ...actual,
    uploadBdcPhoto: vi.fn(),
    deleteBdcPhoto: vi.fn(),
  };
});

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { deleteBdcPhoto, uploadBdcPhoto } from '@/lib/storage/blob';
import {
  deleteBdcPhotoAction,
  patchBdcPhotoAction,
  reorderBdcPhotosAction,
  uploadBdcPhotoAction,
} from './photo-actions';

// Casts pour accéder aux mocks typés.
const mockAuth = vi.mocked(auth);
const mockGetWorkshop = vi.mocked(getActiveWorkshop);
const mockUploadBlob = vi.mocked(uploadBdcPhoto);
const mockDeleteBlob = vi.mocked(deleteBdcPhoto);
const mockRevalidate = vi.mocked(revalidatePath);

const WORKSHOP = {
  id: 'workshop_TEST',
  clerkOrgId: 'org_test',
  // Les autres champs ne sont pas lus par photo-actions.ts ; on cast en any
  // pour ne pas dupliquer le model Workshop complet.
} as unknown as Awaited<ReturnType<typeof getActiveWorkshop>>;

function makeFile({
  type = 'image/jpeg',
  size = 1024 * 100,
  name = 'photo.jpg',
}: { type?: string; size?: number; name?: string } = {}) {
  // Le constructeur File natif (Node 20+) accepte un Uint8Array.
  const bytes = new Uint8Array(size);
  return new File([bytes], name, { type });
}

beforeEach(() => {
  mockAuth.mockResolvedValue({ userId: 'user_TEST' } as never);
  mockGetWorkshop.mockResolvedValue(WORKSHOP);
});

afterEach(() => {
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// uploadBdcPhotoAction
// ─────────────────────────────────────────────────────────────────────────────

describe('uploadBdcPhotoAction', () => {
  it('refuse si utilisateur non authentifié', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    const fd = new FormData();
    fd.set('bdcId', 'bdc_x');
    fd.set('file', makeFile());
    const r = await uploadBdcPhotoAction(fd);
    expect(r).toEqual({ ok: false, error: 'Non authentifié' });
  });

  it('refuse si aucun workshop actif', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    const fd = new FormData();
    fd.set('bdcId', 'bdc_x');
    fd.set('file', makeFile());
    const r = await uploadBdcPhotoAction(fd);
    expect(r).toEqual({ ok: false, error: 'Aucun workshop actif' });
  });

  it('refuse si bdcId manquant', async () => {
    const fd = new FormData();
    fd.set('file', makeFile());
    const r = await uploadBdcPhotoAction(fd);
    expect(r).toEqual({ ok: false, error: 'bdcId requis' });
  });

  it('refuse si file manquant', async () => {
    const fd = new FormData();
    fd.set('bdcId', 'bdc_x');
    const r = await uploadBdcPhotoAction(fd);
    expect(r).toEqual({ ok: false, error: 'Fichier manquant' });
  });

  it('refuse si MIME non whitelisté', async () => {
    const fd = new FormData();
    fd.set('bdcId', 'bdc_x');
    fd.set('file', makeFile({ type: 'application/pdf' }));
    const r = await uploadBdcPhotoAction(fd);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('application/pdf');
  });

  it('refuse si fichier > 10 Mo', async () => {
    const fd = new FormData();
    fd.set('bdcId', 'bdc_x');
    fd.set('file', makeFile({ size: 11 * 1024 * 1024 }));
    const r = await uploadBdcPhotoAction(fd);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('Max 10 Mo');
  });

  it("refuse si BDT introuvable dans le workshop actif", async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValueOnce(null);
    const fd = new FormData();
    fd.set('bdcId', 'bdc_orphan');
    fd.set('file', makeFile());
    const r = await uploadBdcPhotoAction(fd);
    expect(r).toEqual({ ok: false, error: 'BDT introuvable' });
    expect(mockUploadBlob).not.toHaveBeenCalled();
  });

  it("propage l'erreur Blob si uploadBdcPhoto throw", async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValueOnce({ id: 'bdc_x' } as never);
    mockUploadBlob.mockRejectedValueOnce(new Error('Blob 503'));
    const fd = new FormData();
    fd.set('bdcId', 'bdc_x');
    fd.set('file', makeFile());
    const r = await uploadBdcPhotoAction(fd);
    expect(r).toEqual({ ok: false, error: 'Blob 503' });
  });

  it('crée la row BdcPhoto avec position 0 si galerie vide', async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValueOnce({ id: 'bdc_x' } as never);
    mockUploadBlob.mockResolvedValueOnce({
      blobUrl: 'https://blob.vercel.app/x.jpg',
      blobPath: 'workshops/workshop_TEST/bdcs/bdc_x/uuid.jpg',
    });
    vi.mocked(prisma.bdcPhoto.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.bdcPhoto.create).mockResolvedValueOnce({} as never);

    const fd = new FormData();
    fd.set('bdcId', 'bdc_x');
    fd.set('file', makeFile({ type: 'image/png', size: 5000 }));
    const r = await uploadBdcPhotoAction(fd);

    expect(r).toEqual({ ok: true, photoId: 'bphoto_FAKE_ULID' });
    const createCall = vi.mocked(prisma.bdcPhoto.create).mock.calls[0]![0];
    expect(createCall.data).toMatchObject({
      id: 'bphoto_FAKE_ULID',
      workshopId: 'workshop_TEST',
      bdcId: 'bdc_x',
      blobUrl: 'https://blob.vercel.app/x.jpg',
      mimeType: 'image/png',
      kind: 'AUTRE',
      position: 0,
      createdById: 'user_TEST',
    });
  });

  it('assigne la position N+1 si galerie déjà peuplée', async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValueOnce({ id: 'bdc_x' } as never);
    mockUploadBlob.mockResolvedValueOnce({
      blobUrl: 'https://blob.vercel.app/x.jpg',
      blobPath: 'workshops/workshop_TEST/bdcs/bdc_x/uuid.jpg',
    });
    vi.mocked(prisma.bdcPhoto.findFirst).mockResolvedValueOnce({ position: 4 } as never);
    vi.mocked(prisma.bdcPhoto.create).mockResolvedValueOnce({} as never);

    const fd = new FormData();
    fd.set('bdcId', 'bdc_x');
    fd.set('file', makeFile());
    await uploadBdcPhotoAction(fd);

    const createCall = vi.mocked(prisma.bdcPhoto.create).mock.calls[0]![0];
    expect(createCall.data.position).toBe(5);
  });

  it('normalise un kind invalide vers AUTRE', async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValueOnce({ id: 'bdc_x' } as never);
    mockUploadBlob.mockResolvedValueOnce({
      blobUrl: 'u',
      blobPath: 'p',
    });
    vi.mocked(prisma.bdcPhoto.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.bdcPhoto.create).mockResolvedValueOnce({} as never);

    const fd = new FormData();
    fd.set('bdcId', 'bdc_x');
    fd.set('file', makeFile());
    fd.set('kind', 'BIDON');
    await uploadBdcPhotoAction(fd);

    expect(vi.mocked(prisma.bdcPhoto.create).mock.calls[0]![0].data.kind).toBe('AUTRE');
  });

  it('accepte les kinds canoniques (case-insensitive)', async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValue({ id: 'bdc_x' } as never);
    mockUploadBlob.mockResolvedValue({ blobUrl: 'u', blobPath: 'p' });
    vi.mocked(prisma.bdcPhoto.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.bdcPhoto.create).mockResolvedValue({} as never);

    for (const k of ['avant', 'APRES', 'Degat', 'SERIE']) {
      const fd = new FormData();
      fd.set('bdcId', 'bdc_x');
      fd.set('file', makeFile());
      fd.set('kind', k);
      await uploadBdcPhotoAction(fd);
    }

    const kinds = vi
      .mocked(prisma.bdcPhoto.create)
      .mock.calls.map((c) => c[0].data.kind);
    expect(kinds).toEqual(['AVANT', 'APRES', 'DEGAT', 'SERIE']);
  });

  it('caption vide est stockée comme null', async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValueOnce({ id: 'bdc_x' } as never);
    mockUploadBlob.mockResolvedValueOnce({ blobUrl: 'u', blobPath: 'p' });
    vi.mocked(prisma.bdcPhoto.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.bdcPhoto.create).mockResolvedValueOnce({} as never);

    const fd = new FormData();
    fd.set('bdcId', 'bdc_x');
    fd.set('file', makeFile());
    fd.set('caption', '   ');
    await uploadBdcPhotoAction(fd);

    expect(vi.mocked(prisma.bdcPhoto.create).mock.calls[0]![0].data.caption).toBeNull();
  });

  it('caption non-vide est trimmée puis stockée', async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValueOnce({ id: 'bdc_x' } as never);
    mockUploadBlob.mockResolvedValueOnce({ blobUrl: 'u', blobPath: 'p' });
    vi.mocked(prisma.bdcPhoto.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.bdcPhoto.create).mockResolvedValueOnce({} as never);

    const fd = new FormData();
    fd.set('bdcId', 'bdc_x');
    fd.set('file', makeFile());
    fd.set('caption', '  vélo avant réparation  ');
    await uploadBdcPhotoAction(fd);

    expect(vi.mocked(prisma.bdcPhoto.create).mock.calls[0]![0].data.caption).toBe(
      'vélo avant réparation',
    );
  });

  it('appelle revalidatePath après succès', async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValueOnce({ id: 'bdc_x' } as never);
    mockUploadBlob.mockResolvedValueOnce({ blobUrl: 'u', blobPath: 'p' });
    vi.mocked(prisma.bdcPhoto.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.bdcPhoto.create).mockResolvedValueOnce({} as never);

    const fd = new FormData();
    fd.set('bdcId', 'bdc_x');
    fd.set('file', makeFile());
    await uploadBdcPhotoAction(fd);

    expect(mockRevalidate).toHaveBeenCalledWith(
      '/[locale]/admin/inventaire/bdc_x',
      'page',
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// deleteBdcPhotoAction
// ─────────────────────────────────────────────────────────────────────────────

describe('deleteBdcPhotoAction', () => {
  it('refuse si non authentifié', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    const r = await deleteBdcPhotoAction('bphoto_x');
    expect(r).toEqual({ ok: false, error: 'Non authentifié' });
  });

  it('refuse si aucun workshop actif', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    const r = await deleteBdcPhotoAction('bphoto_x');
    expect(r).toEqual({ ok: false, error: 'Aucun workshop actif' });
  });

  it('refuse si photo introuvable (autre workshop ou déjà supprimée)', async () => {
    vi.mocked(prisma.bdcPhoto.findFirst).mockResolvedValueOnce(null);
    const r = await deleteBdcPhotoAction('bphoto_x');
    expect(r).toEqual({ ok: false, error: 'Photo introuvable' });
  });

  it('soft-delete par défaut : update deletedAt, ne touche pas le Blob', async () => {
    vi.mocked(prisma.bdcPhoto.findFirst).mockResolvedValueOnce({
      id: 'bphoto_x',
      bdcId: 'bdc_x',
      blobPath: 'workshops/w/bdcs/bdc_x/u.jpg',
    } as never);
    vi.mocked(prisma.bdcPhoto.update).mockResolvedValueOnce({} as never);

    const r = await deleteBdcPhotoAction('bphoto_x');

    expect(r).toEqual({ ok: true });
    expect(mockDeleteBlob).not.toHaveBeenCalled();
    expect(vi.mocked(prisma.bdcPhoto.delete)).not.toHaveBeenCalled();
    const updateCall = vi.mocked(prisma.bdcPhoto.update).mock.calls[0]![0];
    expect(updateCall.where).toEqual({ id: 'bphoto_x' });
    expect(updateCall.data.deletedAt).toBeInstanceOf(Date);
  });

  it('hardDelete : appelle deleteBdcPhoto puis prisma.bdcPhoto.delete', async () => {
    vi.mocked(prisma.bdcPhoto.findFirst).mockResolvedValueOnce({
      id: 'bphoto_x',
      bdcId: 'bdc_x',
      blobPath: 'workshops/w/bdcs/bdc_x/u.jpg',
    } as never);
    mockDeleteBlob.mockResolvedValueOnce(undefined);
    vi.mocked(prisma.bdcPhoto.delete).mockResolvedValueOnce({} as never);

    const r = await deleteBdcPhotoAction('bphoto_x', { hardDelete: true });

    expect(r).toEqual({ ok: true });
    expect(mockDeleteBlob).toHaveBeenCalledWith('workshops/w/bdcs/bdc_x/u.jpg');
    expect(vi.mocked(prisma.bdcPhoto.delete)).toHaveBeenCalledWith({
      where: { id: 'bphoto_x' },
    });
    expect(vi.mocked(prisma.bdcPhoto.update)).not.toHaveBeenCalled();
  });

  it('hardDelete : ignore une erreur Blob (déjà supprimé) et delete la row quand même', async () => {
    vi.mocked(prisma.bdcPhoto.findFirst).mockResolvedValueOnce({
      id: 'bphoto_x',
      bdcId: 'bdc_x',
      blobPath: 'p',
    } as never);
    mockDeleteBlob.mockRejectedValueOnce(new Error('404 Not Found'));
    vi.mocked(prisma.bdcPhoto.delete).mockResolvedValueOnce({} as never);

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const r = await deleteBdcPhotoAction('bphoto_x', { hardDelete: true });

    expect(r).toEqual({ ok: true });
    expect(vi.mocked(prisma.bdcPhoto.delete)).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('revalidate le path du BDT parent', async () => {
    vi.mocked(prisma.bdcPhoto.findFirst).mockResolvedValueOnce({
      id: 'bphoto_x',
      bdcId: 'bdc_PARENT',
      blobPath: 'p',
    } as never);
    vi.mocked(prisma.bdcPhoto.update).mockResolvedValueOnce({} as never);

    await deleteBdcPhotoAction('bphoto_x');

    expect(mockRevalidate).toHaveBeenCalledWith(
      '/[locale]/admin/inventaire/bdc_PARENT',
      'page',
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// reorderBdcPhotosAction
// ─────────────────────────────────────────────────────────────────────────────

describe('reorderBdcPhotosAction', () => {
  it('refuse si non authentifié', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    const r = await reorderBdcPhotosAction('bdc_x', ['a', 'b']);
    expect(r).toEqual({ ok: false, error: 'Non authentifié' });
  });

  it('refuse si aucun workshop actif', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    const r = await reorderBdcPhotosAction('bdc_x', ['a', 'b']);
    expect(r).toEqual({ ok: false, error: 'Aucun workshop actif' });
  });

  it('refuse si BDT introuvable', async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValueOnce(null);
    const r = await reorderBdcPhotosAction('bdc_orphan', ['a']);
    expect(r).toEqual({ ok: false, error: 'BDT introuvable' });
    expect(vi.mocked(prisma.$transaction)).not.toHaveBeenCalled();
  });

  it('lance une transaction avec un updateMany par photo, position = index', async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValueOnce({ id: 'bdc_x' } as never);
    vi.mocked(prisma.$transaction).mockResolvedValueOnce([] as never);
    vi.mocked(prisma.bdcPhoto.updateMany).mockReturnValue({} as never);

    const r = await reorderBdcPhotosAction('bdc_x', ['p1', 'p2', 'p3']);

    expect(r).toEqual({ ok: true });
    expect(vi.mocked(prisma.bdcPhoto.updateMany)).toHaveBeenCalledTimes(3);
    const calls = vi.mocked(prisma.bdcPhoto.updateMany).mock.calls;
    expect(calls[0]![0]).toEqual({
      where: { id: 'p1', bdcId: 'bdc_x', workshopId: 'workshop_TEST' },
      data: { position: 0 },
    });
    expect(calls[1]![0].data).toEqual({ position: 1 });
    expect(calls[2]![0].data).toEqual({ position: 2 });
  });

  it('accepte une liste vide (no-op)', async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValueOnce({ id: 'bdc_x' } as never);
    vi.mocked(prisma.$transaction).mockResolvedValueOnce([] as never);

    const r = await reorderBdcPhotosAction('bdc_x', []);

    expect(r).toEqual({ ok: true });
    expect(vi.mocked(prisma.bdcPhoto.updateMany)).not.toHaveBeenCalled();
  });

  it('revalidate le path du BDT', async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValueOnce({ id: 'bdc_R' } as never);
    vi.mocked(prisma.$transaction).mockResolvedValueOnce([] as never);

    await reorderBdcPhotosAction('bdc_R', ['p1']);

    expect(mockRevalidate).toHaveBeenCalledWith(
      '/[locale]/admin/inventaire/bdc_R',
      'page',
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// patchBdcPhotoAction
// ─────────────────────────────────────────────────────────────────────────────

describe('patchBdcPhotoAction', () => {
  it('refuse si non authentifié', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    const r = await patchBdcPhotoAction('bphoto_x', { caption: 'x' });
    expect(r).toEqual({ ok: false, error: 'Non authentifié' });
  });

  it('refuse si aucun workshop actif', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    const r = await patchBdcPhotoAction('bphoto_x', { caption: 'x' });
    expect(r).toEqual({ ok: false, error: 'Aucun workshop actif' });
  });

  it('refuse si photo introuvable', async () => {
    vi.mocked(prisma.bdcPhoto.findFirst).mockResolvedValueOnce(null);
    const r = await patchBdcPhotoAction('bphoto_x', { caption: 'x' });
    expect(r).toEqual({ ok: false, error: 'Photo introuvable' });
  });

  it('met à jour la caption (string non-vide)', async () => {
    vi.mocked(prisma.bdcPhoto.findFirst).mockResolvedValueOnce({
      id: 'bphoto_x',
      bdcId: 'bdc_x',
    } as never);
    vi.mocked(prisma.bdcPhoto.update).mockResolvedValueOnce({} as never);

    const r = await patchBdcPhotoAction('bphoto_x', { caption: 'nouvelle légende' });

    expect(r).toEqual({ ok: true });
    expect(vi.mocked(prisma.bdcPhoto.update).mock.calls[0]![0]).toEqual({
      where: { id: 'bphoto_x' },
      data: { caption: 'nouvelle légende' },
    });
  });

  it('permet de remettre la caption à null', async () => {
    vi.mocked(prisma.bdcPhoto.findFirst).mockResolvedValueOnce({
      id: 'bphoto_x',
      bdcId: 'bdc_x',
    } as never);
    vi.mocked(prisma.bdcPhoto.update).mockResolvedValueOnce({} as never);

    await patchBdcPhotoAction('bphoto_x', { caption: null });

    expect(vi.mocked(prisma.bdcPhoto.update).mock.calls[0]![0].data).toEqual({
      caption: null,
    });
  });

  it('met à jour le kind si valide', async () => {
    vi.mocked(prisma.bdcPhoto.findFirst).mockResolvedValueOnce({
      id: 'bphoto_x',
      bdcId: 'bdc_x',
    } as never);
    vi.mocked(prisma.bdcPhoto.update).mockResolvedValueOnce({} as never);

    await patchBdcPhotoAction('bphoto_x', { kind: 'AVANT' });

    expect(vi.mocked(prisma.bdcPhoto.update).mock.calls[0]![0].data).toEqual({
      kind: 'AVANT',
    });
  });

  it('ignore un kind invalide (filet de sécurité)', async () => {
    vi.mocked(prisma.bdcPhoto.findFirst).mockResolvedValueOnce({
      id: 'bphoto_x',
      bdcId: 'bdc_x',
    } as never);
    vi.mocked(prisma.bdcPhoto.update).mockResolvedValueOnce({} as never);

    await patchBdcPhotoAction('bphoto_x', { kind: 'BIDON' as never });

    expect(vi.mocked(prisma.bdcPhoto.update).mock.calls[0]![0].data).toEqual({});
  });

  it('peut patcher caption + kind ensemble', async () => {
    vi.mocked(prisma.bdcPhoto.findFirst).mockResolvedValueOnce({
      id: 'bphoto_x',
      bdcId: 'bdc_x',
    } as never);
    vi.mocked(prisma.bdcPhoto.update).mockResolvedValueOnce({} as never);

    await patchBdcPhotoAction('bphoto_x', {
      caption: 'après serrage cocottes',
      kind: 'APRES',
    });

    expect(vi.mocked(prisma.bdcPhoto.update).mock.calls[0]![0].data).toEqual({
      caption: 'après serrage cocottes',
      kind: 'APRES',
    });
  });

  it('revalidate le path du BDT parent', async () => {
    vi.mocked(prisma.bdcPhoto.findFirst).mockResolvedValueOnce({
      id: 'bphoto_x',
      bdcId: 'bdc_P',
    } as never);
    vi.mocked(prisma.bdcPhoto.update).mockResolvedValueOnce({} as never);

    await patchBdcPhotoAction('bphoto_x', { caption: 'x' });

    expect(mockRevalidate).toHaveBeenCalledWith(
      '/[locale]/admin/inventaire/bdc_P',
      'page',
    );
  });
});
