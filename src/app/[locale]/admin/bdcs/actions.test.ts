import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Tests des Server Actions BDT.
// Sections :
//   1. Actions « patch » simples (sans transaction ni redirect)
//   2. Actions complexes — guards uniquement (auth, workshop, validation Zod).
//      Les paths heureux passent par prisma.$transaction + recordStockMovement
//      qui méritent des tests d'intégration plutôt que des mocks granulaires.

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    bdc: { findFirst: vi.fn(), update: vi.fn() },
    bdcItem: { findFirst: vi.fn(), update: vi.fn() },
    bdcItemTask: { findFirst: vi.fn(), update: vi.fn() },
    velo: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/workshop', () => ({
  getActiveWorkshop: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock('@/lib/stock', () => ({ recordStockMovement: vi.fn() }));

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import {
  addBdtItemAction,
  archiveBdtWithChoiceAction,
  createBdtAction,
  deleteBdtAction,
  patchBdcAvanceAction,
  patchBdcNotesAction,
  patchBdcRemisesAction,
  patchBdtCheckboxAction,
  patchBdtEvalStatusAction,
  removeBdtItemAction,
  updateBdtWorkflowAction,
  updatePieceItemCmdAction,
  updateTaskStatusAction,
} from './actions';

const mockAuth = vi.mocked(auth);
const mockGetWorkshop = vi.mocked(getActiveWorkshop);
const mockRevalidate = vi.mocked(revalidatePath);

const WORKSHOP = { id: 'workshop_TEST' } as unknown as Awaited<
  ReturnType<typeof getActiveWorkshop>
>;

// Helper FormData partagé par les describe de la Section 2 (les Section 1
// describes ont leur propre `fd` local pour préserver leur API existante).
function fd(values: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.set(k, v);
  return f;
}

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

// ─────────────────────────────────────────────────────────────────────────────
// Section 2 — Actions complexes (transactions, redirect, stock movements)
// Couverture guards uniquement. Path heureux → tests d'intégration séparés.
// ─────────────────────────────────────────────────────────────────────────────

describe('createBdtAction', () => {
  const VALID = { veloId: 'velo_x', evalStatus: 'INDECIS', archiveStatus: 'ACTIF' };

  it('refuse si non auth', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    expect(await createBdtAction(null, fd(VALID))).toEqual({ error: 'Non authentifié' });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    expect(await createBdtAction(null, fd(VALID))).toEqual({
      error: 'Aucun workshop actif',
    });
  });

  it('refuse si veloId vide', async () => {
    const r = await createBdtAction(null, fd({ ...VALID, veloId: '' }));
    expect(r).toEqual({ error: 'Validation échouée' });
  });

  it('refuse si evalStatus invalide', async () => {
    const r = await createBdtAction(null, fd({ ...VALID, evalStatus: 'BIDON' }));
    expect(r).toEqual({ error: 'Validation échouée' });
  });

  it('refuse si archiveStatus invalide', async () => {
    const r = await createBdtAction(null, fd({ ...VALID, archiveStatus: 'BIDON' }));
    expect(r).toEqual({ error: 'Validation échouée' });
  });

  it('refuse si vélo introuvable dans le workshop', async () => {
    vi.mocked(prisma.velo.findFirst).mockResolvedValueOnce(null);
    const r = await createBdtAction(null, fd(VALID));
    expect(r).toEqual({ error: 'Vélo introuvable' });
  });
});

describe('addBdtItemAction', () => {
  const VALID = { bdcId: 'bdc_x', kind: 'SERVICE', refId: 'svc_x', qty: '1' };

  it('refuse si non auth', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    expect(await addBdtItemAction(null, fd(VALID))).toEqual({ error: 'Non authentifié' });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    expect(await addBdtItemAction(null, fd(VALID))).toEqual({
      error: 'Aucun workshop actif',
    });
  });

  it('refuse si kind invalide', async () => {
    const r = await addBdtItemAction(null, fd({ ...VALID, kind: 'BIDON' }));
    expect(r.error).toBe('Validation échouée');
    expect(r.fieldErrors?.kind).toBeDefined();
  });

  it('refuse si refId vide', async () => {
    const r = await addBdtItemAction(null, fd({ ...VALID, refId: '' }));
    expect(r.error).toBe('Validation échouée');
    expect(r.fieldErrors?.refId).toBeDefined();
  });

  it('refuse si qty négatif', async () => {
    const r = await addBdtItemAction(null, fd({ ...VALID, qty: '-1' }));
    expect(r.error).toBe('Validation échouée');
    expect(r.fieldErrors?.qty).toBeDefined();
  });

  it('accepte les 3 kinds canoniques (validation Zod)', async () => {
    // La validation passe, après ça transaction non mockée throw.
    for (const kind of ['SERVICE', 'PIECE', 'FORFAIT']) {
      const r = await addBdtItemAction(null, fd({ ...VALID, kind }))
        .catch(() => ({ thrown: true }));
      expect((r as { fieldErrors?: unknown }).fieldErrors).toBeUndefined();
    }
  });
});

describe('removeBdtItemAction', () => {
  it('refuse si non auth', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    expect(await removeBdtItemAction('item_x')).toEqual({ error: 'Non authentifié' });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    expect(await removeBdtItemAction('item_x')).toEqual({ error: 'Aucun workshop actif' });
  });

  it("propage l'erreur du transaction (item introuvable, etc.)", async () => {
    vi.mocked(prisma.$transaction).mockRejectedValueOnce(new Error('Item introuvable'));
    const r = await removeBdtItemAction('item_orphan');
    expect(r).toEqual({ error: 'Item introuvable' });
  });

  it("renvoie 'Suppression échouée' pour erreur non-Error", async () => {
    vi.mocked(prisma.$transaction).mockRejectedValueOnce('crash');
    const r = await removeBdtItemAction('item_x');
    expect(r).toEqual({ error: 'Suppression échouée' });
  });
});

describe('updateBdtWorkflowAction', () => {
  const VALID = {
    bdcId: 'bdc_x',
    evalStatus: 'APPROUVE',
    archiveStatus: 'ACTIF',
  };

  it('refuse si non auth', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    expect(await updateBdtWorkflowAction(null, fd(VALID))).toEqual({
      error: 'Non authentifié',
    });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    expect(await updateBdtWorkflowAction(null, fd(VALID))).toEqual({
      error: 'Aucun workshop actif',
    });
  });

  it('refuse si evalStatus invalide', async () => {
    const r = await updateBdtWorkflowAction(null, fd({ ...VALID, evalStatus: 'BIDON' }));
    expect(r).toEqual({ error: 'Validation échouée' });
  });

  it('refuse si BDT introuvable', async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValueOnce(null);
    const r = await updateBdtWorkflowAction(null, fd(VALID));
    expect(r).toEqual({ error: 'BDT introuvable' });
  });
});

describe('archiveBdtWithChoiceAction', () => {
  it('refuse si non auth', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    expect(await archiveBdtWithChoiceAction('bdc_x', 'COMPTANT')).toEqual({
      error: 'Non authentifié',
    });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    expect(await archiveBdtWithChoiceAction('bdc_x', 'COMPTANT')).toEqual({
      error: 'Aucun workshop actif',
    });
  });

  it('refuse si choix invalide', async () => {
    expect(await archiveBdtWithChoiceAction('bdc_x', 'BIDON' as never)).toEqual({
      error: 'Choix invalide',
    });
  });

  it('refuse si BDT introuvable', async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValueOnce(null);
    expect(await archiveBdtWithChoiceAction('bdc_orphan', 'COMPTANT')).toEqual({
      error: 'BDT introuvable',
    });
  });

  it("choix REFUSE : archiveStatus = ARCHIVE_REFUSE (pas de paiement)", async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValueOnce({ id: 'bdc_x' } as never);
    vi.mocked(prisma.bdc.update).mockResolvedValueOnce({} as never);

    const r = await archiveBdtWithChoiceAction('bdc_x', 'REFUSE');

    expect(r).toEqual({});
    expect(vi.mocked(prisma.bdc.update).mock.calls[0]![0]).toEqual({
      where: { id: 'bdc_x' },
      data: { archiveStatus: 'ARCHIVE_REFUSE', cbArchiver: true },
    });
  });
});

describe('deleteBdtAction', () => {
  it('refuse si non auth', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null } as never);
    expect(await deleteBdtAction('bdc_x')).toEqual({ error: 'Non authentifié' });
  });

  it('refuse si workshop manquant', async () => {
    mockGetWorkshop.mockResolvedValueOnce(null);
    expect(await deleteBdtAction('bdc_x')).toEqual({ error: 'Aucun workshop actif' });
  });

  it('refuse si BDT introuvable', async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValueOnce(null);
    expect(await deleteBdtAction('bdc_orphan')).toEqual({ error: 'BDT introuvable' });
  });

  it('soft-delete + redirect si BDT trouvé', async () => {
    vi.mocked(prisma.bdc.findFirst).mockResolvedValueOnce({ id: 'bdc_x' } as never);
    vi.mocked(prisma.bdc.update).mockResolvedValueOnce({} as never);

    await expect(deleteBdtAction('bdc_x')).rejects.toThrow('NEXT_REDIRECT');

    expect(
      vi.mocked(prisma.bdc.update).mock.calls[0]![0].data.deletedAt,
    ).toBeInstanceOf(Date);
  });
});
