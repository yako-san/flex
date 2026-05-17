import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';
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
      select: { id: true, nom: true, taillesDisponibles: true },
    }),
    prisma.equipeMember.findMany({
      where: { workshopId: workshop.id, active: true },
      orderBy: { surnom: 'asc' },
      select: { id: true, surnom: true },
    }),
  ]);

  if (!velo) notFound();

  return (
    <div>
      <PageHeader
        eyebrow="catalogue · modifier vélo"
        title={`Modifier vélo ${String(velo.veloNumero).padStart(4, '0')}`}
      />
      <div className="bloc-contenu mx-auto max-w-[800px] p-6">
        <Link
          href={`/${locale}/admin/velos/${id}`}
          className="mb-4 inline-block text-sm text-[var(--text-secondary-60)] hover:text-[var(--dark)]"
        >
          ← Fiche vélo
        </Link>
        <VeloForm
          initial={velo}
          clients={clients}
          marques={marques.map((m) => ({
            id: m.id,
            nom: m.nom,
            taillesDisponibles: Array.isArray(m.taillesDisponibles)
              ? (m.taillesDisponibles as string[])
              : [],
          }))}
          equipe={equipe}
        />
      </div>
    </div>
  );
}
