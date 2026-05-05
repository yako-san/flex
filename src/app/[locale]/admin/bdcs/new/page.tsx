import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { NewBdtForm } from './new-bdt-form';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ veloId?: string }>;
};

export default async function NewBdtPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const workshop = await getActiveWorkshop();
  if (!workshop) return <p>Aucun workshop actif.</p>;

  const velos = await prisma.velo.findMany({
    where: { workshopId: workshop.id, deletedAt: null },
    orderBy: { veloNumero: 'desc' },
    include: {
      client: { select: { prenom: true, nom: true } },
      marque: { select: { nom: true } },
    },
  });

  const veloOptions = velos.map((v) => ({
    id: v.id,
    label: `${String(v.veloNumero).padStart(4, '0')} — ${
      v.client ? `${v.client.prenom} ${v.client.nom}` : 'sans client'
    } · ${[v.marque?.nom, v.modele, v.couleur].filter(Boolean).join(', ') || '?'}`,
  }));

  return (
    <div style={{ maxWidth: 720 }}>
      <Link
        href={`/${locale}/admin/bdcs`}
        style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1rem' }}
      >
        ← Tous les BDT
      </Link>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Nouveau bon de travail</h1>
      <NewBdtForm velos={veloOptions} defaultVeloId={sp.veloId ?? null} />
    </div>
  );
}
