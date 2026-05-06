import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { buildFactureHtml } from '@/lib/pdf-html/templates/facture';
import { htmlToPdf } from '@/lib/pdf-html/render';
import type { ItemRow } from '@/lib/pdf-html/templates/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });
  const workshop = await getActiveWorkshop();
  if (!workshop) return new NextResponse('No active workshop', { status: 403 });

  const { id } = await params;
  const facture = await prisma.factureLog.findFirst({
    where: { id, workshopId: workshop.id },
  });
  if (!facture) return new NextResponse('Not found', { status: 404 });

  const client = facture.clientId
    ? await prisma.client.findUnique({ where: { id: facture.clientId } })
    : null;

  let velo = null;
  if (facture.bdcId) {
    const bdc = await prisma.bdc.findUnique({
      where: { id: facture.bdcId },
      include: { velo: { include: { marque: true } } },
    });
    if (bdc?.velo) {
      velo = {
        veloNumero: bdc.velo.veloNumero,
        marque: bdc.velo.marque?.nom ?? null,
        modele: bdc.velo.modele,
        couleur: bdc.velo.couleur,
        taille: bdc.velo.taille,
        numeroSerie: bdc.velo.numeroSerie,
      };
    }
  }

  const fiscalEntity =
    (workshop.fiscalEntity as Record<string, string> | null | undefined) ?? null;

  const lines = (facture.linesSnapshot as unknown as Array<{
    position: number;
    kind: 'SERVICE' | 'PIECE' | 'FORFAIT';
    label: string;
    qty: string;
    unitPrice: string;
    total: string;
  }>) ?? [];

  const items: ItemRow[] = lines.map((l) => ({
    position: l.position,
    kind: l.kind,
    label: l.label,
    sku: null,
    qty: Number(l.qty),
    unitPrice: Number(l.unitPrice),
    total: Number(l.total),
  }));

  const html = buildFactureHtml({
    workshop: {
      name: workshop.name,
      logoBase64: workshop.logoBase64 ?? null,
      fiscalEntity,
    },
    client: client
      ? {
          prenom: client.prenom,
          nom: client.nom,
          telephone: client.telephone,
          indicatif: client.indicatif,
          courriel: client.courriel,
        }
      : { prenom: 'Walk-in', nom: '', telephone: null, indicatif: null, courriel: null },
    velo,
    factureNumero: facture.factureNumero,
    date: facture.date,
    items,
    totals: {
      totalServices: Number(facture.totalServices),
      totalPieces: Number(facture.totalPieces),
      // Remises = total brut des items - total post-remise stocké
      remises: (() => {
        const gross = lines.reduce((acc, l) => acc + Number(l.total), 0);
        const net = Number(facture.totalServices) + Number(facture.totalPieces);
        return Math.max(0, Math.round((gross - net) * 100) / 100);
      })(),
      sousTotal: Number(facture.sousTotal),
      tps: Number(facture.tps),
      tvq: Number(facture.tvq),
      grandTotal: Number(facture.grandTotal),
    },
    modePaiement: facture.modePaiement,
    notes: facture.notes,
  });

  const buffer = await htmlToPdf(html);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${facture.factureNumero}.pdf"`,
    },
  });
}
