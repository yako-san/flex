import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getActiveWorkshop } from '@/lib/workshop';
import { loadBdcPdfContext } from '@/lib/pdf-html/load-bdc-context';
import { buildEvalHtml } from '@/lib/pdf-html/templates/eval';
import { htmlToPdf } from '@/lib/pdf-html/render';

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
  const ctx = await loadBdcPdfContext(workshop, id);
  if (!ctx) return new NextResponse('Not found', { status: 404 });

  const html = buildEvalHtml({
    workshop: ctx.workshop,
    client: ctx.client,
    velo: ctx.velo,
    bdcId: ctx.bdcId,
    date: new Date(),
    items: ctx.items,
    totalServices: ctx.totalServices,
    totalPieces: ctx.totalPieces,
    remises: ctx.remises,
    notes: ctx.noteClientEval,
  });

  const buffer = await htmlToPdf(html);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="eval-${id.slice(-6)}.pdf"`,
    },
  });
}
