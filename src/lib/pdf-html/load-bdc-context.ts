import { prisma } from '@/lib/db';
import type { Workshop } from '@prisma/client';
import type { ClientInfo, ItemRow, VeloInfo, WorkshopInfo } from './templates/types';

export type BdcPdfContext = {
  workshop: WorkshopInfo;
  client: ClientInfo;
  velo: VeloInfo;
  bdcId: string;
  notes: string | null;
  items: ItemRow[];
  tasksByItem: Record<number, { label: string; status: string }[]>;
  totalServices: number;
  totalPieces: number;
  remises: number;
};

export async function loadBdcPdfContext(
  workshop: Workshop,
  bdcId: string,
): Promise<BdcPdfContext | null> {
  const bdc = await prisma.bdc.findFirst({
    where: { id: bdcId, workshopId: workshop.id, deletedAt: null },
    include: {
      velo: { include: { client: true, marque: { select: { nom: true } } } },
      items: {
        orderBy: { position: 'asc' },
        include: { tasks: { orderBy: { position: 'asc' } } },
      },
    },
  });
  if (!bdc) return null;

  const fiscalEntity = bdc.workshopId
    ? ((workshop.fiscalEntity as Record<string, string> | null | undefined) ?? null)
    : null;

  const workshopInfo: WorkshopInfo = {
    name: workshop.name,
    logoBase64: workshop.logoBase64 ?? null,
    fiscalEntity,
  };

  const client: ClientInfo = bdc.velo.client
    ? {
        prenom: bdc.velo.client.prenom,
        nom: bdc.velo.client.nom,
        telephone: bdc.velo.client.telephone,
        indicatif: bdc.velo.client.indicatif,
        courriel: bdc.velo.client.courriel,
      }
    : { prenom: '?', nom: '', telephone: null, indicatif: null, courriel: null };

  const velo: VeloInfo = {
    veloNumero: bdc.velo.veloNumero,
    marque: bdc.velo.marque?.nom ?? null,
    modele: bdc.velo.modele,
    couleur: bdc.velo.couleur,
    taille: bdc.velo.taille,
    numeroSerie: bdc.velo.numeroSerie,
  };

  const items: ItemRow[] = bdc.items.map((it) => ({
    position: it.position,
    kind: it.kind,
    label: it.labelSnapshot,
    sku: null,
    qty: Number(it.qty),
    unitPrice: Number(it.unitPriceSnapshot),
    total: Number(it.total),
  }));

  const tasksByItem: Record<number, { label: string; status: string }[]> = {};
  for (const it of bdc.items) {
    if (it.tasks.length > 0) {
      tasksByItem[it.position] = it.tasks.map((t) => ({
        label: t.labelSnapshot,
        status: t.status,
      }));
    }
  }

  // Calcul remises : totaux bruts items - totaux post-remise sur Bdc
  const totalServicesGross = items
    .filter((it) => it.kind === 'SERVICE' || it.kind === 'FORFAIT')
    .reduce((acc, it) => acc + it.total, 0);
  const totalPiecesGross = items
    .filter((it) => it.kind === 'PIECE')
    .reduce((acc, it) => acc + it.total, 0);

  // Bdc.totalServices et totalPieces sont en réalité pré-remise (recalcBdtTotals
  // additionne juste les items). Pour le PDF, on calcule les remises depuis les
  // champs remise{Svc,Pce}{Type,Value}.
  const remSvcVal = bdc.remiseSvcValue ? Number(bdc.remiseSvcValue) : 0;
  const remPceVal = bdc.remisePceValue ? Number(bdc.remisePceValue) : 0;
  const remSvcAmount =
    bdc.remiseSvcType === 'PCT' ? totalServicesGross * (remSvcVal / 100)
    : bdc.remiseSvcType === 'FIXED' ? remSvcVal
    : 0;
  const remPceAmount =
    bdc.remisePceType === 'PCT' ? totalPiecesGross * (remPceVal / 100)
    : bdc.remisePceType === 'FIXED' ? remPceVal
    : 0;
  const remises = Math.round((remSvcAmount + remPceAmount) * 100) / 100;

  return {
    workshop: workshopInfo,
    client,
    velo,
    bdcId,
    notes: bdc.notes,
    items,
    tasksByItem,
    totalServices: totalServicesGross,
    totalPieces: totalPiecesGross,
    remises,
  };
}
