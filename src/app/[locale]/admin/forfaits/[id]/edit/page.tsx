import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';
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
    <div>
      <PageHeader
        eyebrow="catalogue · modifier forfait"
        title={`Modifier ${f.labelCanonical}`}
      />
      <div className="mx-auto max-w-[800px] p-6">
        <Link href={`/${locale}/admin/forfaits`} className="mb-4 inline-block text-sm text-[var(--text-secondary-60)] hover:text-[var(--dark)]">← Tous les forfaits</Link>
        <ForfaitForm initial={f} initialTasks={f.taskTemplates.map((t) => ({ labelCanonical: t.labelCanonical }))} />
      </div>
    </div>
  );
}
