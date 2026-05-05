import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getActiveWorkshop } from '@/lib/workshop';
import { BonSortiePdf } from '@/lib/pdf/documents';
import { pdfToBuffer } from '@/lib/pdf/render';
import { loadBdcPdfContext } from '@/lib/pdf/load-bdc-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

  const buffer = await pdfToBuffer(
    BonSortiePdf({
      workshop: ctx.workshop,
      client: ctx.client,
      velo: ctx.velo,
      bdcId: ctx.bdcId,
      date: new Date(),
      items: ctx.items,
      tasksByItem: ctx.tasksByItem,
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="bon-sortie-${id.slice(-6)}.pdf"`,
    },
  });
}
