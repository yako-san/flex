'use server';

import { z } from 'zod';
import Decimal from 'decimal.js';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { generateId } from '@/lib/ids/generate-id';
import { recordStockMovement } from '@/lib/stock';

// =============================================================================
// Helpers internes
// =============================================================================

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function recalcBdtTotals(tx: Tx, bdcId: string): Promise<void> {
  const items = await tx.bdcItem.findMany({
    where: { bdcId },
    select: { kind: true, total: true },
  });
  const zero = new Decimal(0);
  const totalServices = items
    .filter((i) => i.kind === 'SERVICE' || i.kind === 'FORFAIT')
    .reduce((acc, i) => acc.plus(new Decimal(i.total.toString())), zero);
  const totalPieces = items
    .filter((i) => i.kind === 'PIECE')
    .reduce((acc, i) => acc.plus(new Decimal(i.total.toString())), zero);
  await tx.bdc.update({
    where: { id: bdcId },
    data: {
      totalServices: new Prisma.Decimal(totalServices.toString()),
      totalPieces: new Prisma.Decimal(totalPieces.toString()),
    },
  });
}

// =============================================================================
// Création BDT
// =============================================================================

const createBdtSchema = z.object({
  veloId: z.string().trim().min(1),
  evalStatus: z.enum(['INDECIS', 'ATTENTE', 'APPROUVE', 'REDUX', 'REFUSE']),
  archiveStatus: z.enum([
    'ACTIF',
    'ARCHIVE_FACTURE',
    'ARCHIVE_A_FACTURER',
    'ARCHIVE_REFUSE',
    'ARCHIVE_CTRL_QLTE',
    'ARCHIVE_EVAL',
    'ARCHIVE_LEGACY',
  ]),
  notes: z.string().optional().nullable(),
});

export type BdtFormState = { error?: string; fieldErrors?: Record<string, string> };

export async function createBdtAction(
  _prev: BdtFormState | null,
  formData: FormData,
): Promise<BdtFormState> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const parsed = createBdtSchema.safeParse({
    veloId: formData.get('veloId') ?? '',
    evalStatus: formData.get('evalStatus') ?? 'INDECIS',
    archiveStatus: formData.get('archiveStatus') ?? 'ACTIF',
    notes: formData.get('notes') || null,
  });

  if (!parsed.success) {
    return { error: 'Validation échouée' };
  }
  const data = parsed.data;

  const velo = await prisma.velo.findFirst({
    where: { id: data.veloId, workshopId: workshop.id, deletedAt: null },
  });
  if (!velo) return { error: 'Vélo introuvable' };

  // Allocation atomique d'un numéro séquentiel BDT via Counter.
  const id = generateId('bdc');
  const numero = await prisma.$transaction(async (tx) => {
    const counter = await tx.counter.findFirst({
      where: { workshopId: workshop.id, kind: 'BDT_SEQUENCE' },
    });
    const next = (counter?.current ?? 0) + 1;
    if (counter) {
      await tx.counter.update({
        where: { id: counter.id },
        data: { current: next },
      });
    } else {
      await tx.counter.create({
        data: {
          id: generateId('ctr'),
          workshopId: workshop.id,
          kind: 'BDT_SEQUENCE',
          current: next,
        },
      });
    }
    await tx.bdc.create({
      data: {
        id,
        workshopId: workshop.id,
        veloId: data.veloId,
        numero: next,
        evalStatus: data.evalStatus,
        archiveStatus: data.archiveStatus,
        notes: data.notes ?? null,
      },
    });
    return next;
  });

  revalidatePath('/[locale]/admin/bdcs', 'page');
  revalidatePath(`/[locale]/admin/velos/${data.veloId}`, 'page');
  redirect(`/fr-CA/admin/bdcs/${id}?numero=${numero}`);
}

// =============================================================================
// Ajout d'item (SERVICE / PIECE / FORFAIT)
// =============================================================================

const addItemSchema = z.object({
  bdcId: z.string().trim().min(1),
  kind: z.enum(['SERVICE', 'PIECE', 'FORFAIT']),
  refId: z.string().trim().min(1, 'Sélection requise'),
  qty: z.coerce.number().positive().default(1),
});

export async function addBdtItemAction(
  _prev: BdtFormState | null,
  formData: FormData,
): Promise<BdtFormState> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const parsed = addItemSchema.safeParse({
    bdcId: formData.get('bdcId') ?? '',
    kind: formData.get('kind') ?? '',
    refId: formData.get('refId') ?? '',
    qty: formData.get('qty') ?? 1,
  });

  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? '_');
      if (!fe[key]) fe[key] = issue.message;
    }
    return { error: 'Validation échouée', fieldErrors: fe };
  }
  const { bdcId, kind, refId, qty } = parsed.data;

  await prisma.$transaction(async (tx) => {
    const bdc = await tx.bdc.findFirst({
      where: { id: bdcId, workshopId: workshop.id, deletedAt: null },
    });
    if (!bdc) throw new Error('BDT introuvable');

    // Position : à la suite des items existants
    const last = await tx.bdcItem.findFirst({
      where: { bdcId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    const position = (last?.position ?? 0) + 1;

    const itemId = generateId('bdci');
    let labelSnapshot = '';
    let unitPriceSnapshot = new Decimal(0);
    let taxableSnapshot = true;

    if (kind === 'SERVICE') {
      const svc = await tx.service.findFirst({
        where: { id: refId, workshopId: workshop.id, deletedAt: null },
      });
      if (!svc) throw new Error('Service introuvable');
      labelSnapshot = svc.labelCanonical;
      unitPriceSnapshot = new Decimal(svc.prix.toString());
      taxableSnapshot = svc.taxable;
      await tx.bdcItem.create({
        data: {
          id: itemId,
          workshopId: workshop.id,
          bdcId,
          kind,
          position,
          serviceId: refId,
          labelSnapshot,
          unitPriceSnapshot: new Prisma.Decimal(unitPriceSnapshot.toString()),
          taxableSnapshot,
          qty: new Prisma.Decimal(qty),
          total: new Prisma.Decimal(unitPriceSnapshot.times(qty).toString()),
        },
      });
    } else if (kind === 'PIECE') {
      const piece = await tx.piece.findFirst({
        where: { id: refId, workshopId: workshop.id, deletedAt: null },
      });
      if (!piece) throw new Error('Pièce introuvable');
      labelSnapshot = piece.nomCanonical;
      unitPriceSnapshot = new Decimal(piece.prixVente.toString());
      taxableSnapshot = piece.taxable;
      await tx.bdcItem.create({
        data: {
          id: itemId,
          workshopId: workshop.id,
          bdcId,
          kind,
          position,
          pieceId: refId,
          labelSnapshot,
          unitPriceSnapshot: new Prisma.Decimal(unitPriceSnapshot.toString()),
          taxableSnapshot,
          qty: new Prisma.Decimal(qty),
          total: new Prisma.Decimal(unitPriceSnapshot.times(qty).toString()),
        },
      });
      // Réservation de stock : la pièce est engagée sur ce BDT actif.
      await recordStockMovement(tx, {
        workshopId: workshop.id,
        pieceId: refId,
        type: 'RESERVATION',
        delta: qty,
        bdcItemId: itemId,
        reason: 'Réservation par ajout d\'item BDT',
        createdById: userId,
      });
    } else {
      // FORFAIT
      const forfait = await tx.forfait.findFirst({
        where: { id: refId, workshopId: workshop.id, deletedAt: null },
        include: { taskTemplates: { orderBy: { position: 'asc' } } },
      });
      if (!forfait) throw new Error('Forfait introuvable');
      labelSnapshot = forfait.labelCanonical;
      unitPriceSnapshot = new Decimal(forfait.prix.toString());
      taxableSnapshot = forfait.taxable;
      await tx.bdcItem.create({
        data: {
          id: itemId,
          workshopId: workshop.id,
          bdcId,
          kind,
          position,
          forfaitId: refId,
          labelSnapshot,
          unitPriceSnapshot: new Prisma.Decimal(unitPriceSnapshot.toString()),
          taxableSnapshot,
          qty: new Prisma.Decimal(qty),
          total: new Prisma.Decimal(unitPriceSnapshot.times(qty).toString()),
        },
      });
      // Crée les sous-tâches depuis les templates du forfait
      for (const tpl of forfait.taskTemplates) {
        await tx.bdcItemTask.create({
          data: {
            id: generateId('task'),
            bdcItemId: itemId,
            position: tpl.position,
            labelSnapshot: tpl.labelCanonical,
            status: 'TODO',
          },
        });
      }
    }

    await recalcBdtTotals(tx, bdcId);
  });

  revalidatePath(`/[locale]/admin/bdcs/${bdcId}`, 'page');
  return {};
}

// =============================================================================
// Suppression d'item
// =============================================================================

export async function removeBdtItemAction(
  itemId: string,
): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  let bdcId = '';
  try {
    await prisma.$transaction(async (tx) => {
      const item = await tx.bdcItem.findFirst({
        where: { id: itemId, workshopId: workshop.id },
        select: { bdcId: true, kind: true, pieceId: true, qty: true },
      });
      if (!item) throw new Error('Item introuvable');
      bdcId = item.bdcId;
      await tx.bdcItemTask.deleteMany({ where: { bdcItemId: itemId } });

      // Si l'item était une pièce avec réservation, on libère le stock avant
      // de supprimer l'item (pour éviter contrainte FK sur stock_movement).
      if (item.kind === 'PIECE' && item.pieceId) {
        // FK SET NULL sur StockMovement.bdcItemId → on peut supprimer l'item
        // en gardant l'historique. Mais on ajoute aussi un RELEASE pour
        // libérer le stockReserve.
        const qty = Number(item.qty);
        await recordStockMovement(tx, {
          workshopId: workshop.id,
          pieceId: item.pieceId,
          type: 'RELEASE',
          delta: -qty,
          bdcItemId: itemId,
          reason: 'Libération réservation par suppression d\'item BDT',
          createdById: userId,
        });
      }

      await tx.bdcItem.delete({ where: { id: itemId } });
      await recalcBdtTotals(tx, bdcId);
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Suppression échouée' };
  }

  revalidatePath(`/[locale]/admin/bdcs/${bdcId}`, 'page');
  return {};
}

// =============================================================================
// Workflow : checkboxes + eval/archive status + notes/remises
// =============================================================================

const updateWorkflowSchema = z.object({
  bdcId: z.string().trim().min(1),
  evalStatus: z.enum(['INDECIS', 'ATTENTE', 'APPROUVE', 'REDUX', 'REFUSE']),
  archiveStatus: z.enum([
    'ACTIF',
    'ARCHIVE_FACTURE',
    'ARCHIVE_A_FACTURER',
    'ARCHIVE_REFUSE',
    'ARCHIVE_CTRL_QLTE',
    'ARCHIVE_EVAL',
    'ARCHIVE_LEGACY',
  ]),
  cbEvalEnvoye: z.coerce.boolean(),
  cbEval: z.coerce.boolean(),
  cbBonSortie: z.coerce.boolean(),
  cbArchiver: z.coerce.boolean(),
  remiseSvcType: z.enum(['PCT', 'FIXED', '']).optional(),
  remiseSvcValue: z.string().trim().optional().nullable(),
  remisePceType: z.enum(['PCT', 'FIXED', '']).optional(),
  remisePceValue: z.string().trim().optional().nullable(),
  avanceMontant: z.string().trim().optional().nullable(),
  avanceMode: z.enum(['COMPTANT', 'INTERAC', 'CARTES', '']).optional(),
  avanceNote: z.string().optional().nullable(),
  noteClientEval: z.string().optional().nullable(),
  noteClientFacture: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function updateBdtWorkflowAction(
  _prev: BdtFormState | null,
  formData: FormData,
): Promise<BdtFormState> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const parsed = updateWorkflowSchema.safeParse({
    bdcId: formData.get('bdcId') ?? '',
    evalStatus: formData.get('evalStatus') ?? 'INDECIS',
    archiveStatus: formData.get('archiveStatus') ?? 'ACTIF',
    cbEvalEnvoye: formData.get('cbEvalEnvoye') === 'on',
    cbEval: formData.get('cbEval') === 'on',
    cbBonSortie: formData.get('cbBonSortie') === 'on',
    cbArchiver: formData.get('cbArchiver') === 'on',
    remiseSvcType: (formData.get('remiseSvcType') as string) || '',
    remiseSvcValue: (formData.get('remiseSvcValue') as string) || null,
    remisePceType: (formData.get('remisePceType') as string) || '',
    remisePceValue: (formData.get('remisePceValue') as string) || null,
    avanceMontant: (formData.get('avanceMontant') as string) || null,
    avanceMode: (formData.get('avanceMode') as string) || '',
    avanceNote: formData.get('avanceNote') || null,
    noteClientEval: formData.get('noteClientEval') || null,
    noteClientFacture: formData.get('noteClientFacture') || null,
    notes: formData.get('notes') || null,
  });

  if (!parsed.success) return { error: 'Validation échouée' };
  const data = parsed.data;

  const existing = await prisma.bdc.findFirst({
    where: { id: data.bdcId, workshopId: workshop.id, deletedAt: null },
  });
  if (!existing) return { error: 'BDT introuvable' };

  const remSvcVal = data.remiseSvcValue && data.remiseSvcValue.trim() !== ''
    ? new Prisma.Decimal(data.remiseSvcValue)
    : null;
  const remPceVal = data.remisePceValue && data.remisePceValue.trim() !== ''
    ? new Prisma.Decimal(data.remisePceValue)
    : null;
  const remSvcType =
    data.remiseSvcType === 'PCT' || data.remiseSvcType === 'FIXED' ? data.remiseSvcType : null;
  const remPceType =
    data.remisePceType === 'PCT' || data.remisePceType === 'FIXED' ? data.remisePceType : null;

  const avanceMontant =
    data.avanceMontant && data.avanceMontant.trim() !== ''
      ? new Prisma.Decimal(data.avanceMontant)
      : null;
  const avanceMode =
    data.avanceMode === 'COMPTANT' || data.avanceMode === 'INTERAC' || data.avanceMode === 'CARTES'
      ? data.avanceMode
      : null;

  await prisma.bdc.update({
    where: { id: data.bdcId },
    data: {
      evalStatus: data.evalStatus,
      archiveStatus: data.archiveStatus,
      cbEvalEnvoye: data.cbEvalEnvoye,
      cbEval: data.cbEval,
      cbBonSortie: data.cbBonSortie,
      cbArchiver: data.cbArchiver,
      remiseSvcType: remSvcType,
      remiseSvcValue: remSvcType ? remSvcVal : null,
      remisePceType: remPceType,
      remisePceValue: remPceType ? remPceVal : null,
      avanceMontant,
      avanceMode,
      avanceNote: data.avanceNote ?? null,
      noteClientEval: data.noteClientEval ?? null,
      noteClientFacture: data.noteClientFacture ?? null,
      notes: data.notes ?? null,
    },
  });

  revalidatePath(`/[locale]/admin/bdcs/${data.bdcId}`, 'page');
  return {};
}

// =============================================================================
// Item pièce : workflow commande fournisseur (cmdStatus + cmdNote)
// =============================================================================

const CMD_STATUS_VALUES = [
  'LISTEE',
  'ESTIMEE',
  'A_COMMANDER',
  'EN_COMMANDE',
  'RECU_PARTIEL',
  'RECUE',
] as const;

export async function updatePieceItemCmdAction(
  itemId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const rawStatus = String(formData.get('cmdStatus') ?? '').trim();
  const cmdStatus = CMD_STATUS_VALUES.includes(rawStatus as (typeof CMD_STATUS_VALUES)[number])
    ? (rawStatus as (typeof CMD_STATUS_VALUES)[number])
    : null;
  const cmdNoteRaw = formData.get('cmdNote');
  const cmdNote =
    typeof cmdNoteRaw === 'string' && cmdNoteRaw.trim() !== '' ? cmdNoteRaw : null;

  const item = await prisma.bdcItem.findFirst({
    where: { id: itemId, workshopId: workshop.id, kind: 'PIECE' },
    select: { id: true, bdcId: true },
  });
  if (!item) return { error: 'Item pièce introuvable' };

  await prisma.bdcItem.update({
    where: { id: item.id },
    data: { cmdStatus, cmdNote },
  });

  revalidatePath(`/[locale]/admin/bdcs/${item.bdcId}`, 'page');
  return {};
}

// =============================================================================
// Sous-tâche forfait : changement de status TODO ↔ DONE ↔ SKIPPED
// =============================================================================

export async function updateTaskStatusAction(
  taskId: string,
  status: 'TODO' | 'DONE' | 'SKIPPED',
): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const task = await prisma.bdcItemTask.findFirst({
    where: { id: taskId, bdcItem: { workshopId: workshop.id } },
    select: { bdcItem: { select: { bdcId: true } } },
  });
  if (!task) return { error: 'Sous-tâche introuvable' };

  await prisma.bdcItemTask.update({
    where: { id: taskId },
    data: {
      status,
      doneAt: status === 'DONE' ? new Date() : null,
    },
  });

  revalidatePath(`/[locale]/admin/bdcs/${task.bdcItem.bdcId}`, 'page');
  return {};
}

// =============================================================================
// Soft delete BDT
// =============================================================================

export async function deleteBdtAction(bdcId: string): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: 'Non authentifié' };
  const workshop = await getActiveWorkshop();
  if (!workshop) return { error: 'Aucun workshop actif' };

  const existing = await prisma.bdc.findFirst({
    where: { id: bdcId, workshopId: workshop.id, deletedAt: null },
  });
  if (!existing) return { error: 'BDT introuvable' };

  await prisma.bdc.update({
    where: { id: bdcId },
    data: { deletedAt: new Date() },
  });

  revalidatePath('/[locale]/admin/bdcs', 'page');
  redirect(`/fr-CA/admin/bdcs`);
}
