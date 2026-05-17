import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';
import { ClientForm } from '../../client-form';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function EditClientPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const workshop = await getActiveWorkshop();
  if (!workshop) return <p>Aucun workshop actif.</p>;

  const client = await prisma.client.findFirst({
    where: { id, workshopId: workshop.id, deletedAt: null },
  });
  if (!client) notFound();

  return (
    <div>
      <PageHeader
        eyebrow="atelier · modifier client"
        title={`Modifier ${client.prenom} ${client.nom}`}
      />
      <div className="bloc-contenu mx-auto max-w-[720px] p-6">
        <Link
          href={`/${locale}/admin/clients/${id}`}
          className="mb-4 inline-block text-sm text-[var(--text-secondary-60)] hover:text-[var(--dark)]"
        >
          ← Fiche client
        </Link>
        <ClientForm initial={client} />
      </div>
    </div>
  );
}
