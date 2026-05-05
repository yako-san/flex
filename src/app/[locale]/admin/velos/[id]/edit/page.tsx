import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { VeloForm } from '../../velo-form';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function EditVeloPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const workshop = await getActiveWorkshop();
  if (!workshop) return <p>Aucun workshop actif.</p>;

  const [velo, clients, marques, equipe] = await Promise.all([
    prisma.velo.findFirst({
      where: { id, workshopId: workshop.id, deletedAt: null },
    }),
    prisma.client.findMany({
      where: { workshopId: workshop.id, deletedAt: null },
      orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
      select: { id: true, prenom: true, nom: true },
    }),
    prisma.marque.findMany({
      where: { workshopId: workshop.id, deletedAt: null },
      orderBy: { nom: 'asc' },
      select: { id: true, nom: true },
    }),
    prisma.equipeMember.findMany({
      where: { workshopId: workshop.id, active: true },
      orderBy: { surnom: 'asc' },
      select: { id: true, surnom: true },
    }),
  ]);

  if (!velo) notFound();

  return (
    <div style={{ maxWidth: 800 }}>
      <Link
        href={`/${locale}/admin/velos/${id}`}
        style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1rem' }}
      >
        ← Fiche vélo
      </Link>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>
        Modifier vélo {String(velo.veloNumero).padStart(4, '0')}
      </h1>
      <VeloForm initial={velo} clients={clients} marques={marques} equipe={equipe} />
    </div>
  );
}
