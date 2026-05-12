import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';
import { EquipeForm } from '../../equipe-form';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function EditEquipePage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const workshop = await getActiveWorkshop();
  if (!workshop) return <p>Aucun workshop actif.</p>;

  const m = await prisma.equipeMember.findFirst({
    where: { id, workshopId: workshop.id },
  });
  if (!m) notFound();

  return (
    <div>
      <PageHeader
        eyebrow="paramètres · modifier membre"
        title={`Modifier ${m.prenom} ${m.nom}`}
      />
      <div className="mx-auto max-w-[720px] p-6">
        <Link href={`/${locale}/admin/equipe`} className="mb-4 inline-block text-sm text-[var(--text-secondary-60)] hover:text-[var(--dark)]">← Toute l&apos;équipe</Link>
        <EquipeForm initial={m} />
      </div>
    </div>
  );
}
