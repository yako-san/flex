import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';
import { ServiceForm } from '../../service-form';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function EditServicePage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const workshop = await getActiveWorkshop();
  if (!workshop) return <p>Aucun workshop actif.</p>;

  const s = await prisma.service.findFirst({
    where: { id, workshopId: workshop.id, deletedAt: null },
  });
  if (!s) notFound();

  return (
    <div>
      <PageHeader
        eyebrow="catalogue à la carte · modifier service"
        title={`Modifier ${s.labelCanonical}`}
      />
      <div className="bloc-contenu mx-auto max-w-[800px] p-6">
        <Link href={`/${locale}/admin/services`} className="mb-4 inline-block text-sm text-[var(--text-secondary-60)] hover:text-[var(--dark)]">← Tous les services</Link>
        <ServiceForm initial={s} />
      </div>
    </div>
  );
}
