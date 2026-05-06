import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { ForfaitForm } from '../../forfait-form';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function EditForfaitPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const workshop = await getActiveWorkshop();
  if (!workshop) return <p>Aucun workshop actif.</p>;

  const f = await prisma.forfait.findFirst({
    where: { id, workshopId: workshop.id, deletedAt: null },
    include: { taskTemplates: { orderBy: { position: 'asc' } } },
  });
  if (!f) notFound();

  return (
    <div style={{ maxWidth: 800 }}>
      <Link href={`/${locale}/admin/forfaits`} style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1rem' }}>← Tous les forfaits</Link>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Modifier {f.labelCanonical}</h1>
      <ForfaitForm initial={f} initialTasks={f.taskTemplates.map((t) => ({ labelCanonical: t.labelCanonical }))} />
    </div>
  );
}
