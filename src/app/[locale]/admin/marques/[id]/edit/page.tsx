import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { MarqueForm } from '../../marque-form';
import { DeleteMarqueButton } from './delete-button';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function EditMarquePage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const workshop = await getActiveWorkshop();
  if (!workshop) return <p>Aucun workshop actif.</p>;

  const m = await prisma.marque.findFirst({
    where: { id, workshopId: workshop.id, deletedAt: null },
    include: { _count: { select: { velos: true } } },
  });
  if (!m) notFound();

  return (
    <div style={{ maxWidth: 600 }}>
      <Link href={`/${locale}/admin/marques`} style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1rem' }}>← Toutes les marques</Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Modifier la marque</h1>
        <DeleteMarqueButton marqueId={m.id} marqueName={m.nom} hasVelos={m._count.velos > 0} />
      </div>
      <MarqueForm
        initial={{
          id: m.id,
          nom: m.nom,
          taillesDisponibles: Array.isArray(m.taillesDisponibles)
            ? (m.taillesDisponibles as string[])
            : [],
        }}
      />
    </div>
  );
}
