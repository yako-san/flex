import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
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
    <div style={{ maxWidth: 720 }}>
      <Link
        href={`/${locale}/admin/clients/${id}`}
        style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1rem' }}
      >
        ← Fiche client
      </Link>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>
        Modifier {client.prenom} {client.nom}
      </h1>
      <ClientForm initial={client} />
    </div>
  );
}
