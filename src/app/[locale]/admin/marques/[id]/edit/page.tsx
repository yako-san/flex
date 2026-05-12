import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';
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
    <div>
      <PageHeader
        eyebrow="paramètres · modifier marque"
        title={`Modifier ${m.nom}`}
        actions={<DeleteMarqueButton marqueId={m.id} marqueName={m.nom} hasVelos={m._count.velos > 0} />}
      />
      <div className="mx-auto max-w-[720px] p-6">
        <Link href={`/${locale}/admin/marques`} className="mb-4 inline-block text-sm text-[var(--text-secondary-60)] hover:text-[var(--dark)]">← Toutes les marques</Link>
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
    </div>
  );
}
