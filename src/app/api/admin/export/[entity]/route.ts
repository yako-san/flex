import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { toCsv, csvResponse } from '@/lib/csv';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ENTITIES = ['clients', 'velos', 'pieces', 'bdcs', 'ventes', 'pos', 'factures'] as const;
type Entity = (typeof ENTITIES)[number];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ entity: string }> },
) {
  const { userId } = await auth();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });
  const workshop = await getActiveWorkshop();
  if (!workshop) return new NextResponse('No active workshop', { status: 403 });

  const { entity } = await params;
  if (!ENTITIES.includes(entity as Entity)) {
    return new NextResponse('Unknown entity', { status: 400 });
  }

  const wid = workshop.id;
  const stamp = new Date().toISOString().slice(0, 10);

  if (entity === 'clients') {
    const rows = await prisma.client.findMany({
      where: { workshopId: wid, deletedAt: null },
      orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
    });
    const csv = toCsv(rows.map((c) => ({
      id: c.id,
      prenom: c.prenom,
      nom: c.nom,
      indicatif: c.indicatif,
      telephone: c.telephone,
      courriel: c.courriel,
      lang: c.lang,
      commPref: c.commPref,
      lead: c.lead,
      remiseDefault: c.remiseDefault?.toString() ?? '',
      notes: c.notes,
      createdAt: c.createdAt,
    })), [
      { key: 'id' }, { key: 'prenom', label: 'Prénom' }, { key: 'nom', label: 'Nom' },
      { key: 'indicatif' }, { key: 'telephone', label: 'Téléphone' },
      { key: 'courriel' }, { key: 'lang' }, { key: 'commPref' }, { key: 'lead' },
      { key: 'remiseDefault' }, { key: 'notes' }, { key: 'createdAt' },
    ]);
    return csvResponse(csv, `clients-${stamp}.csv`);
  }

  if (entity === 'velos') {
    const rows = await prisma.velo.findMany({
      where: { workshopId: wid, deletedAt: null },
      orderBy: { veloNumero: 'desc' },
      include: {
        client: { select: { prenom: true, nom: true } },
        marque: { select: { nom: true } },
      },
    });
    const csv = toCsv(rows.map((v) => ({
      id: v.id,
      veloNumero: v.veloNumero,
      client: v.client ? `${v.client.prenom} ${v.client.nom}` : '',
      marque: v.marque?.nom ?? '',
      modele: v.modele,
      couleur: v.couleur,
      taille: v.taille,
      numeroSerie: v.numeroSerie,
      status: v.status,
      notes: v.notes,
      createdAt: v.createdAt,
    })), [
      { key: 'id' }, { key: 'veloNumero', label: 'N°' }, { key: 'client' },
      { key: 'marque' }, { key: 'modele' }, { key: 'couleur' }, { key: 'taille' },
      { key: 'numeroSerie', label: 'Série' }, { key: 'status' }, { key: 'notes' },
      { key: 'createdAt' },
    ]);
    return csvResponse(csv, `velos-${stamp}.csv`);
  }

  if (entity === 'pieces') {
    const rows = await prisma.piece.findMany({
      where: { workshopId: wid, deletedAt: null },
      orderBy: [{ categorie: 'asc' }, { nomCanonical: 'asc' }],
    });
    const csv = toCsv(rows.map((p) => ({
      id: p.id,
      legacyCode: p.legacyCode,
      sku: p.sku,
      codeBarre: p.codeBarre,
      nom: p.nomCanonical,
      categorie: p.categorie,
      fournisseur: p.fournisseur,
      prixAchat: p.prixAchat?.toString() ?? '',
      prixVente: p.prixVente.toString(),
      taxable: p.taxable,
      stockPhysique: p.stockPhysique,
      stockReserve: p.stockReserve,
    })), [
      { key: 'id' }, { key: 'legacyCode', label: 'Code v1' }, { key: 'sku' },
      { key: 'codeBarre', label: 'Code-barre' }, { key: 'nom' }, { key: 'categorie' },
      { key: 'fournisseur' }, { key: 'prixAchat' }, { key: 'prixVente' },
      { key: 'taxable' }, { key: 'stockPhysique' }, { key: 'stockReserve' },
    ]);
    return csvResponse(csv, `pieces-${stamp}.csv`);
  }

  if (entity === 'bdcs') {
    const rows = await prisma.bdc.findMany({
      where: { workshopId: wid, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        velo: {
          select: {
            veloNumero: true,
            modele: true,
            client: { select: { prenom: true, nom: true } },
            marque: { select: { nom: true } },
          },
        },
        factures: { select: { factureNumero: true, grandTotal: true, date: true } },
      },
    });
    const csv = toCsv(rows.map((b) => ({
      id: b.id,
      numero: String(b.numero).padStart(4, '0'),
      veloNumero: String(b.velo.veloNumero).padStart(4, '0'),
      client: b.velo.client ? `${b.velo.client.prenom} ${b.velo.client.nom}` : '',
      marque: b.velo.marque?.nom ?? '',
      modele: b.velo.modele ?? '',
      evalStatus: b.evalStatus,
      archiveStatus: b.archiveStatus,
      totalServices: b.totalServices.toString(),
      totalPieces: b.totalPieces.toString(),
      facturesNumeros: b.factures.map((f) => f.factureNumero).join('; '),
      grandTotalFacture: b.factures.reduce((acc, f) => acc + Number(f.grandTotal), 0).toFixed(2),
      createdAt: b.createdAt,
    })), [
      { key: 'id' }, { key: 'numero', label: 'BDT n°' },
      { key: 'veloNumero', label: 'Vélo n°' }, { key: 'client' },
      { key: 'marque' }, { key: 'modele' }, { key: 'evalStatus', label: 'Éval' },
      { key: 'archiveStatus', label: 'Archive' }, { key: 'totalServices' },
      { key: 'totalPieces' }, { key: 'facturesNumeros', label: 'Factures' },
      { key: 'grandTotalFacture' }, { key: 'createdAt' },
    ]);
    return csvResponse(csv, `bdcs-${stamp}.csv`);
  }

  if (entity === 'ventes') {
    const rows = await prisma.venteDirecte.findMany({
      where: { workshopId: wid, deletedAt: null },
      orderBy: { date: 'desc' },
      include: { client: { select: { prenom: true, nom: true } } },
    });
    const csv = toCsv(rows.map((v) => ({
      id: v.id,
      date: v.date,
      factureNumero: v.factureNumero,
      factureDate: v.factureDate,
      client: v.client ? `${v.client.prenom} ${v.client.nom}` : 'walk-in',
      modePaiement: v.modePaiement,
      totalPieces: v.totalPieces.toString(),
      notes: v.notes,
    })), [
      { key: 'id' }, { key: 'date' }, { key: 'factureNumero' }, { key: 'factureDate' },
      { key: 'client' }, { key: 'modePaiement' }, { key: 'totalPieces' }, { key: 'notes' },
    ]);
    return csvResponse(csv, `ventes-${stamp}.csv`);
  }

  if (entity === 'pos') {
    const rows = await prisma.po.findMany({
      where: { workshopId: wid, deletedAt: null },
      orderBy: { dateCommande: 'desc' },
      include: { _count: { select: { items: true } } },
    });
    const csv = toCsv(rows.map((p) => ({
      id: p.id,
      poNumero: p.poNumero,
      fournisseur: p.fournisseur,
      dateCommande: p.dateCommande,
      dateReception: p.dateReception,
      status: p.status,
      itemsCount: p._count.items,
      notes: p.notes,
    })), [
      { key: 'id' }, { key: 'poNumero', label: 'N°' }, { key: 'fournisseur' },
      { key: 'dateCommande' }, { key: 'dateReception' }, { key: 'status' },
      { key: 'itemsCount', label: 'Items' }, { key: 'notes' },
    ]);
    return csvResponse(csv, `pos-${stamp}.csv`);
  }

  if (entity === 'factures') {
    const rows = await prisma.factureLog.findMany({
      where: { workshopId: wid },
      orderBy: { date: 'desc' },
      include: { client: { select: { prenom: true, nom: true } } },
    });
    const csv = toCsv(rows.map((f) => ({
      id: f.id,
      factureNumero: f.factureNumero,
      type: f.type,
      date: f.date,
      client: f.client ? `${f.client.prenom} ${f.client.nom}` : '',
      modePaiement: f.modePaiement,
      statut: f.statut,
      totalServices: f.totalServices.toString(),
      totalPieces: f.totalPieces.toString(),
      sousTotal: f.sousTotal.toString(),
      tps: f.tps.toString(),
      tvq: f.tvq.toString(),
      grandTotal: f.grandTotal.toString(),
    })), [
      { key: 'id' }, { key: 'factureNumero', label: 'N° facture' }, { key: 'type' },
      { key: 'date' }, { key: 'client' }, { key: 'modePaiement' }, { key: 'statut' },
      { key: 'totalServices' }, { key: 'totalPieces' }, { key: 'sousTotal' },
      { key: 'tps' }, { key: 'tvq' }, { key: 'grandTotal' },
    ]);
    return csvResponse(csv, `factures-${stamp}.csv`);
  }

  return new NextResponse('Unhandled', { status: 500 });
}
