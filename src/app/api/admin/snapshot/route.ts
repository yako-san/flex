import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Snapshot complet du workshop actif au format JSON. Lecture seule, ne
// modifie rien. Inclut toutes les tables relationnelles pour permettre
// une restauration manuelle si nécessaire (ou un audit point-in-time).
//
// Format :
// {
//   meta: { exportedAt, schemaVersion, workshopId, workshopSlug },
//   workshop: {...},
//   clients: [...], velos: [...], bdcs: [...], bdcItems: [...],
//   bdcItemTasks: [...], pieces: [...], services: [...], forfaits: [...],
//   forfaitTaskTemplates: [...], marques: [...], equipeMembers: [...],
//   venteDirectes: [...], venteDirecteItems: [...], pos: [...],
//   poItems: [...], factureLogs: [...], stockMovements: [...],
//   counters: [...], translations: [...], emailLogs: [...],
//   auditLogs: [...], legacyIdMappings: [...]
// }
//
// Décimaux Prisma sérialisés en string (pour précision préservée).

export async function GET(_req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });
  const workshop = await getActiveWorkshop();
  if (!workshop) return new NextResponse('No active workshop', { status: 403 });

  const wid = workshop.id;

  // Toutes les requêtes en parallèle (pas de FK cross-tables à respecter
  // pour un snapshot lecture seule).
  const [
    workshopFull,
    clients,
    velos,
    bdcs,
    bdcItems,
    bdcItemTasks,
    pieces,
    services,
    forfaits,
    forfaitTaskTemplates,
    marques,
    equipeMembers,
    venteDirectes,
    venteDirecteItems,
    pos,
    poItems,
    factureLogs,
    stockMovements,
    counters,
    translations,
    emailLogs,
    auditLogs,
    legacyIdMappings,
  ] = await Promise.all([
    prisma.workshop.findUnique({ where: { id: wid } }),
    prisma.client.findMany({ where: { workshopId: wid } }),
    prisma.velo.findMany({ where: { workshopId: wid } }),
    prisma.bdc.findMany({ where: { workshopId: wid } }),
    prisma.bdcItem.findMany({ where: { workshopId: wid } }),
    prisma.bdcItemTask.findMany({
      where: { bdcItem: { workshopId: wid } },
    }),
    prisma.piece.findMany({ where: { workshopId: wid } }),
    prisma.service.findMany({ where: { workshopId: wid } }),
    prisma.forfait.findMany({ where: { workshopId: wid } }),
    prisma.forfaitTaskTemplate.findMany({
      where: { forfait: { workshopId: wid } },
    }),
    prisma.marque.findMany({ where: { workshopId: wid } }),
    prisma.equipeMember.findMany({ where: { workshopId: wid } }),
    prisma.venteDirecte.findMany({ where: { workshopId: wid } }),
    prisma.venteDirecteItem.findMany({
      where: { vente: { workshopId: wid } },
    }),
    prisma.po.findMany({ where: { workshopId: wid } }),
    prisma.poItem.findMany({ where: { po: { workshopId: wid } } }),
    prisma.factureLog.findMany({ where: { workshopId: wid } }),
    prisma.stockMovement.findMany({ where: { workshopId: wid } }),
    prisma.counter.findMany({ where: { workshopId: wid } }),
    prisma.translation.findMany({ where: { workshopId: wid } }),
    prisma.emailLog.findMany({ where: { workshopId: wid } }),
    prisma.auditLog.findMany({ where: { workshopId: wid } }),
    prisma.legacyIdMapping.findMany({ where: { workshopId: wid } }),
  ]);

  const snapshot = {
    meta: {
      exportedAt: new Date().toISOString(),
      schemaVersion: 'v2-snapshot/1.0',
      workshopId: wid,
      workshopSlug: workshop.slug,
      workshopName: workshop.name,
      counts: {
        clients: clients.length,
        velos: velos.length,
        bdcs: bdcs.length,
        bdcItems: bdcItems.length,
        bdcItemTasks: bdcItemTasks.length,
        pieces: pieces.length,
        services: services.length,
        forfaits: forfaits.length,
        marques: marques.length,
        equipeMembers: equipeMembers.length,
        venteDirectes: venteDirectes.length,
        venteDirecteItems: venteDirecteItems.length,
        pos: pos.length,
        poItems: poItems.length,
        factureLogs: factureLogs.length,
        stockMovements: stockMovements.length,
        counters: counters.length,
        translations: translations.length,
        emailLogs: emailLogs.length,
        auditLogs: auditLogs.length,
        legacyIdMappings: legacyIdMappings.length,
      },
    },
    workshop: workshopFull,
    clients,
    velos,
    bdcs,
    bdcItems,
    bdcItemTasks,
    pieces,
    services,
    forfaits,
    forfaitTaskTemplates,
    marques,
    equipeMembers,
    venteDirectes,
    venteDirecteItems,
    pos,
    poItems,
    factureLogs,
    stockMovements,
    counters,
    translations,
    emailLogs,
    auditLogs,
    legacyIdMappings,
  };

  // Sérialise en JSON avec replacer pour gérer les Decimal (Prisma renvoie
  // des objets Decimal qui sérialisent en string par défaut, on garde ça).
  const json = JSON.stringify(snapshot, null, 2);

  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const filename = `flex-snapshot-${workshop.slug}-${stamp}.json`;

  return new NextResponse(json, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
