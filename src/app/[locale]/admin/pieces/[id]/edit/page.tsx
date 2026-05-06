import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PieceForm } from '../../piece-form';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function EditPiecePage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const workshop = await getActiveWorkshop();
  if (!workshop) return <p>Aucun workshop actif.</p>;

  const p = await prisma.piece.findFirst({
    where: { id, workshopId: workshop.id, deletedAt: null },
  });
  if (!p) notFound();

  return (
    <div style={{ maxWidth: 900 }}>
      <Link href={`/${locale}/admin/pieces`} style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1rem' }}>← Toutes les pièces</Link>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Modifier {p.nomCanonical}</h1>
      <PieceForm initial={p} />
    </div>
  );
}
