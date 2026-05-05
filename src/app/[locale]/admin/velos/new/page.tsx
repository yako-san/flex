import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { VeloForm } from '../velo-form';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string; clientId?: string }>;
  searchParams: Promise<{ clientId?: string }>;
};

export default async function NewVeloPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const workshop = await getActiveWorkshop();
  if (!workshop) return <p>Aucun workshop actif.</p>;

  const [clients, marques, equipe] = await Promise.all([
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

  return (
    <div style={{ maxWidth: 800 }}>
      <Link
        href={`/${locale}/admin/velos`}
        style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1rem' }}
      >
        ← Tous les vélos
      </Link>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Nouveau vélo</h1>
      <VeloForm
        clients={clients}
        marques={marques}
        equipe={equipe}
        defaultClientId={sp.clientId ?? null}
      />
    </div>
  );
}
