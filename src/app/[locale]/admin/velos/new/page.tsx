import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';
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
      select: { id: true, nom: true, taillesDisponibles: true },
    }),
    prisma.equipeMember.findMany({
      where: { workshopId: workshop.id, active: true },
      orderBy: { surnom: 'asc' },
      select: { id: true, surnom: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="catalogue · nouveau vélo"
        title="Nouveau vélo"
      />
      <div className="bloc-contenu mx-auto max-w-[800px] p-6">
        <Link
          href={`/${locale}/admin/velos`}
          className="mb-4 inline-block text-sm text-[var(--text-secondary-60)] hover:text-[var(--dark)]"
        >
          ← Tous les vélos
        </Link>
        <VeloForm
          clients={clients}
          marques={marques.map((m) => ({
            id: m.id,
            nom: m.nom,
            taillesDisponibles: Array.isArray(m.taillesDisponibles)
              ? (m.taillesDisponibles as string[])
              : [],
          }))}
          equipe={equipe}
          defaultClientId={sp.clientId ?? null}
        />
      </div>
    </div>
  );
}
