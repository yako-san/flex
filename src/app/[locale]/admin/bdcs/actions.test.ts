import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Tests des Server Actions BDT — focus sur les actions « patch » (sans redirect
// ni mutation stock). Voir TODO en bas pour les actions plus complexes encore
// non couvertes (createBdtAction, addBdtItemAction, archiveBdtWithChoiceAction).

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    bdc: { findFirst: vi.fn(), update: vi.fn() },
    bdcItem: { findFirst: vi.fn(), update: vi.fn() },
    bdcItemTask: { findFirst: vi.fn(), update: vi.fn() },
  },
}));

vi.mock('@/lib/workshop', () => ({
  getActiveWorkshop: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import {
  patchBdcAvanceAction,
  patchBdcNotesAction,
  patchBdcRemisesAction,
  patchBdtCheckboxAction,
  patchBdtEvalStatusAction,
  updatePieceItemCmdAction,
  updateTaskStatusAction,
} from './actions';

const mockAuth = vi.mocked(auth);
const mockGetWorkshop = vi.mocked(getActiveWorkshop);
const mockRevalidate = vi.mocked(revalidatePath);

const WORKSHOP = { id: 'workshop_TEST' } as unknown as Awaited<
  ReturnType<typeof getActiveWorkshop>
>;

beforeEach(() => {
  mockAuth.mockResolvedValue({ userId: 'user_TEST' } as never);
  mockGetWorkshop.mockResolvedValue(WORKSHOP);
});

afterEach(() => {
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// patchBdtCheckboxAction
// ─────────────────────────────────────────────────────────────────────────────

describe('patchBdtCheckboxAction', () => {
  it('refuse si non authentifié', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    const r = await patchBdtCheckboxAction('bdc_x', 'cbEval', true);
    expect(r).toEqual({ error: 'Non authentifié' });
  });

  it('refuse si aucun workshop actif', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    const r = await patchBdtCheckboxAction('bdc_x', 'cbEval', true);
    expect(r).toEqual({ error: 'Aucun workshop actif' });
  });

  it('refuse si clé checkbox invalide', async () => {
    const r = await patchBdtCheckboxAction('bdc_x', 'bidon' as never, true);
    expect(r).toEqual({ error: 'Clé checkbox invalide' });
  });

  it('refuse si BDT introuvable', async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValueOnce(null);
    const r = await patchBdtCheckboxAction('bdc_orphan', 'cbEval', true);
    expect(r).toEqual({ error: 'BDT introuvable' });
  });

  it('update le bon champ avec la bonne valeur', async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValueOnce({ id: 'bdc_x' } as never);
    vi.mocked(prisma.bdc.update).mockResolvedValueOnce({} as never);

    const r = await patchBdtCheckboxAction('bdc_x', 'cbBonSortie', true);

    expect(r).toEqual({});
    expect(vi.mocked(prisma.bdc.update).mock.calls[0]![0]).toEqual({
      where: { id: 'bdc_x' },
      data: { cbBonSortie: true },
    });
  });

  it("accepte les 4 clés canoniques", async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValue({ id: 'bdc_x' } as never);
    vi.mocked(prisma.bdc.update).mockResolvedValue({} as never);

    for (const key of ['cbEvalEnvoye', 'cbEval', 'cbBonSortie', 'cbArchiver'] as const) {
      const r = await patchBdtCheckboxAction('bdc_x', key, false);
      expect(r).toEqual({});
    }
    expect(vi.mocked(prisma.bdc.update)).toHaveBeenCalledTimes(4);
  });

  it('revalidate le path inventaire/[bdcId]', async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValueOnce({ id: 'bdc_x' } as never);
    vi.mocked(prisma.bdc.update).mockResolvedValueOnce({} as never);

    await patchBdtCheckboxAction('bdc_x', 'cbEval', true);

    expect(mockRevalidate).toHaveBeenCalledWith(
      '/[locale]/admin/inventaire/bdc_x',
      'page',
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// patchBdtEvalStatusAction
// ─────────────────────────────────────────────────────────────────────────────

describe('patchBdtEvalStatusAction', () => {
  it('refuse si non authentifié', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    const r = await patchBdtEvalStatusAction('bdc_x', 'APPROUVE');
    expect(r).toEqual({ error: 'Non authentifié' });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    const r = await patchBdtEvalStatusAction('bdc_x', 'APPROUVE');
    expect(r).toEqual({ error: 'Aucun workshop actif' });
  });

  it('refuse si status invalide', async () => {
    const r = await patchBdtEvalStatusAction('bdc_x', 'BIDON' as never);
    expect(r).toEqual({ error: 'Statut éval invalide' });
  });

  it('refuse si BDT introuvable', async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValueOnce(null);
    const r = await patchBdtEvalStatusAction('bdc_orphan', 'APPROUVE');
    expect(r).toEqual({ error: 'BDT introuvable' });
  });

  it('accepte les 5 valeurs canoniques', async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValue({ id: 'bdc_x' } as never);
    vi.mocked(prisma.bdc.update).mockResolvedValue({} as never);

    for (const v of ['INDECIS', 'ATTENTE', 'APPROUVE', 'REDUX', 'REFUSE'] as const) {
      const r = await patchBdtEvalStatusAction('bdc_x', v);
      expect(r).toEqual({});
    }
    expect(vi.mocked(prisma.bdc.update)).toHaveBeenCalledTimes(5);
  });

  it('passe le statut au update', async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValueOnce({ id: 'bdc_x' } as never);
    vi.mocked(prisma.bdc.update).mockResolvedValueOnce({} as never);

    await patchBdtEvalStatusAction('bdc_x', 'APPROUVE');

    expect(vi.mocked(prisma.bdc.update).mock.calls[0]![0].data).toEqual({
      evalStatus: 'APPROUVE',
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// updateTaskStatusAction
// ─────────────────────────────────────────────────────────────────────────────

describe('updateTaskStatusAction', () => {
  it('refuse si non authentifié', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    const r = await updateTaskStatusAction('task_x', 'DONE');
    expect(r).toEqual({ error: 'Non authentifié' });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    const r = await updateTaskStatusAction('task_x', 'DONE');
    expect(r).toEqual({ error: 'Aucun workshop actif' });
  });

  it('refuse si task introuvable', async () => {
    vi.mocked(prisma.bdcItemTask.findFirst).mockResolvedValueOnce(null);
    const r = await updateTaskStatusAction('task_orphan', 'DONE');
    expect(r).toEqual({ error: 'Sous-tâche introuvable' });
  });

  it('met doneAt = now() quand status = DONE', async () => {
    vi.mocked(prisma.bdcItemTask.findFirst).mockResolvedValueOnce({
      bdcItem: { bdcId: 'bdc_x' },
    } as never);
    vi.mocked(prisma.bdcItemTask.update).mockResolvedValueOnce({} as never);

    await updateTaskStatusAction('task_x', 'DONE');

    const call = vi.mocked(prisma.bdcItemTask.update).mock.calls[0]![0];
    expect(call.data.status).toBe('DONE');
    expect(call.data.doneAt).toBeInstanceOf(Date);
  });

  it('met doneAt = null quand status = TODO ou SKIPPED', async () => {
    vi.mocked(prisma.bdcItemTask.findFirst).mockResolvedValue({
      bdcItem: { bdcId: 'bdc_x' },
    } as never);
    vi.mocked(prisma.bdcItemTask.update).mockResolvedValue({} as never);

    await updateTaskStatusAction('task_x', 'TODO');
    await updateTaskStatusAction('task_x', 'SKIPPED');

    const calls = vi.mocked(prisma.bdcItemTask.update).mock.calls;
    expect(calls[0]![0].data.doneAt).toBeNull();
    expect(calls[1]![0].data.doneAt).toBeNull();
  });

  it('revalidate le path bdcs du BDT parent', async () => {
    vi.mocked(prisma.bdcItemTask.findFirst).mockResolvedValueOnce({
      bdcItem: { bdcId: 'bdc_PARENT' },
    } as never);
    vi.mocked(prisma.bdcItemTask.update).mockResolvedValueOnce({} as never);

    await updateTaskStatusAction('task_x', 'DONE');

    expect(mockRevalidate).toHaveBeenCalledWith(
      '/[locale]/admin/bdcs/bdc_PARENT',
      'page',
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// updatePieceItemCmdAction
// ─────────────────────────────────────────────────────────────────────────────

describe('updatePieceItemCmdAction', () => {
  function fd(status: string, note: string | null = null): FormData {
    const f = new FormData();
    f.set('cmdStatus', status);
    if (note !== null) f.set('cmdNote', note);
    return f;
  }

  it('refuse si non authentifié', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    const r = await updatePieceItemCmdAction('item_x', fd('A_COMMANDER'));
    expect(r).toEqual({ error: 'Non authentifié' });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    const r = await updatePieceItemCmdAction('item_x', fd('A_COMMANDER'));
    expect(r).toEqual({ error: 'Aucun workshop actif' });
  });

  it("refuse si item pièce introuvable (ou kind ≠ PIECE)", async () => {
    vi.mocked(prisma.bdcItem.findFirst).mockResolvedValueOnce(null);
    const r = await updatePieceItemCmdAction('item_x', fd('A_COMMANDER'));
    expect(r).toEqual({ error: 'Item pièce introuvable' });
  });

  it('status invalide → cmdStatus stocké à null', async () => {
    vi.mocked(prisma.bdcItem.findFirst).mockResolvedValueOnce({
      id: 'item_x',
      bdcId: 'bdc_x',
    } as never);
    vi.mocked(prisma.bdcItem.update).mockResolvedValueOnce({} as never);

    await updatePieceItemCmdAction('item_x', fd('BIDON'));

    expect(vi.mocked(prisma.bdcItem.update).mock.calls[0]![0].data.cmdStatus).toBeNull();
  });

  it('accepte les 6 valeurs canoniques de cmdStatus', async () => {
    vi.mocked(prisma.bdcItem.findFirst).mockResolvedValue({
      id: 'item_x',
      bdcId: 'bdc_x',
    } as never);
    vi.mocked(prisma.bdcItem.update).mockResolvedValue({} as never);

    const all = ['LISTEE', 'ESTIMEE', 'A_COMMANDER', 'EN_COMMANDE', 'RECU_PARTIEL', 'RECUE'];
    for (const s of all) await updatePieceItemCmdAction('item_x', fd(s));

    const statuses = vi
      .mocked(prisma.bdcItem.update)
      .mock.calls.map((c) => c[0].data.cmdStatus);
    expect(statuses).toEqual(all);
  });

  it('cmdNote vide → null', async () => {
    vi.mocked(prisma.bdcItem.findFirst).mockResolvedValueOnce({
      id: 'item_x',
      bdcId: 'bdc_x',
    } as never);
    vi.mocked(prisma.bdcItem.update).mockResolvedValueOnce({} as never);

    await updatePieceItemCmdAction('item_x', fd('A_COMMANDER', '   '));

    expect(vi.mocked(prisma.bdcItem.update).mock.calls[0]![0].data.cmdNote).toBeNull();
  });

  it('cmdNote non-vide → stocké tel quel', async () => {
    vi.mocked(prisma.bdcItem.findFirst).mockResolvedValueOnce({
      id: 'item_x',
      bdcId: 'bdc_x',
    } as never);
    vi.mocked(prisma.bdcItem.update).mockResolvedValueOnce({} as never);

    await updatePieceItemCmdAction('item_x', fd('EN_COMMANDE', 'commandée mardi'));

    expect(vi.mocked(prisma.bdcItem.update).mock.calls[0]![0].data.cmdNote).toBe(
      'commandée mardi',
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// patchBdcRemisesAction
// ─────────────────────────────────────────────────────────────────────────────

describe('patchBdcRemisesAction', () => {
  function fd(values: Record<string, string>): FormData {
    const f = new FormData();
    for (const [k, v] of Object.entries(values)) f.set(k, v);
    return f;
  }

  it('refuse si non authentifié', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    const r = await patchBdcRemisesAction(null, fd({ bdcId: 'bdc_x' }));
    expect(r).toEqual({ error: 'Non authentifié' });
  });

  it('refuse si validation échoue (type invalide)', async () => {
    const r = await patchBdcRemisesAction(
      null,
      fd({ bdcId: 'bdc_x', remiseSvcType: 'BIDON' }),
    );
    expect(r.error).toBeDefined();
  });

  it('refuse si BDT introuvable', async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValueOnce(null);
    const r = await patchBdcRemisesAction(
      null,
      fd({ bdcId: 'bdc_orphan', remiseSvcType: 'PCT', remisePceType: '' }),
    );
    expect(r).toEqual({ error: 'BDT introuvable' });
  });

  it('remiseType vide → stocké à null en DB', async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValueOnce({ id: 'bdc_x' } as never);
    vi.mocked(prisma.bdc.update).mockResolvedValueOnce({} as never);

    await patchBdcRemisesAction(
      null,
      fd({ bdcId: 'bdc_x', remiseSvcType: '', remisePceType: '' }),
    );

    const data = vi.mocked(prisma.bdc.update).mock.calls[0]![0].data;
    expect(data.remiseSvcType).toBeNull();
    expect(data.remisePceType).toBeNull();
  });

  it('remiseType PCT + value valide → stocké', async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValueOnce({ id: 'bdc_x' } as never);
    vi.mocked(prisma.bdc.update).mockResolvedValueOnce({} as never);

    await patchBdcRemisesAction(
      null,
      fd({
        bdcId: 'bdc_x',
        remiseSvcType: 'PCT',
        remiseSvcValue: '10',
        remisePceType: 'FIXED',
        remisePceValue: '5.50',
      }),
    );

    const data = vi.mocked(prisma.bdc.update).mock.calls[0]![0].data;
    expect(data.remiseSvcType).toBe('PCT');
    expect(data.remiseSvcValue).toBe(10);
    expect(data.remisePceType).toBe('FIXED');
    expect(data.remisePceValue).toBe(5.5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// patchBdcAvanceAction
// ─────────────────────────────────────────────────────────────────────────────

describe('patchBdcAvanceAction', () => {
  function fd(values: Record<string, string>): FormData {
    const f = new FormData();
    for (const [k, v] of Object.entries(values)) f.set(k, v);
    return f;
  }

  it('refuse si non authentifié', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    const r = await patchBdcAvanceAction(null, fd({ bdcId: 'bdc_x' }));
    expect(r).toEqual({ error: 'Non authentifié' });
  });

  it('refuse si BDT introuvable', async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValueOnce(null);
    const r = await patchBdcAvanceAction(null, fd({ bdcId: 'bdc_orphan' }));
    expect(r).toEqual({ error: 'BDT introuvable' });
  });

  it('avanceMode vide → null en DB', async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValueOnce({ id: 'bdc_x' } as never);
    vi.mocked(prisma.bdc.update).mockResolvedValueOnce({} as never);

    await patchBdcAvanceAction(null, fd({ bdcId: 'bdc_x', avanceMode: '' }));

    expect(vi.mocked(prisma.bdc.update).mock.calls[0]![0].data.avanceMode).toBeNull();
  });

  it('avance complète (montant + mode + note)', async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValueOnce({ id: 'bdc_x' } as never);
    vi.mocked(prisma.bdc.update).mockResolvedValueOnce({} as never);

    await patchBdcAvanceAction(
      null,
      fd({
        bdcId: 'bdc_x',
        avanceMontant: '50',
        avanceMode: 'INTERAC',
        avanceNote: 'reçu lundi',
      }),
    );

    const data = vi.mocked(prisma.bdc.update).mock.calls[0]![0].data;
    expect(data.avanceMontant).toBe(50);
    expect(data.avanceMode).toBe('INTERAC');
    expect(data.avanceNote).toBe('reçu lundi');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// patchBdcNotesAction
// ─────────────────────────────────────────────────────────────────────────────

describe('patchBdcNotesAction', () => {
  function fd(values: Record<string, string>): FormData {
    const f = new FormData();
    for (const [k, v] of Object.entries(values)) f.set(k, v);
    return f;
  }

  it('refuse si non authentifié', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    const r = await patchBdcNotesAction(null, fd({ bdcId: 'bdc_x' }));
    expect(r).toEqual({ error: 'Non authentifié' });
  });

  it('refuse si BDT introuvable', async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValueOnce(null);
    const r = await patchBdcNotesAction(null, fd({ bdcId: 'bdc_orphan' }));
    expect(r).toEqual({ error: 'BDT introuvable' });
  });

  it('met à jour les 3 champs notes', async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValueOnce({ id: 'bdc_x' } as never);
    vi.mocked(prisma.bdc.update).mockResolvedValueOnce({} as never);

    await patchBdcNotesAction(
      null,
      fd({
        bdcId: 'bdc_x',
        noteClientEval: 'pneus changés',
        noteClientFacture: 'ok merci',
        notes: 'note interne',
      }),
    );

    expect(vi.mocked(prisma.bdc.update).mock.calls[0]![0].data).toEqual({
      noteClientEval: 'pneus changés',
      noteClientFacture: 'ok merci',
      notes: 'note interne',
    });
  });

  it('strings vides → null', async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValueOnce({ id: 'bdc_x' } as never);
    vi.mocked(prisma.bdc.update).mockResolvedValueOnce({} as never);

    await patchBdcNotesAction(
      null,
      fd({ bdcId: 'bdc_x', noteClientEval: '', noteClientFacture: '', notes: '' }),
    );

    expect(vi.mocked(prisma.bdc.update).mock.calls[0]![0].data).toEqual({
      noteClientEval: null,
      noteClientFacture: null,
      notes: null,
    });
  });
});

// TODO (hors scope cette session — nécessite mocks plus complexes) :
// - createBdtAction       : redirect + counter + transaction
// - addBdtItemAction      : multi-branch SERVICE/PIECE/FORFAIT + recordStockMovement
// - removeBdtItemAction   : transaction + RELEASE stock
// - updateBdtWorkflowAction : ~30 champs, gros schéma Zod
// - archiveBdtWithChoiceAction : transaction + factureLog
// - deleteBdtAction       : redirect
