import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';
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
  if (!workshop) return <p className="p-6 text-[var(--text-secondary-60)]">Aucun workshop actif.</p>;

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
    <div>
      <PageHeader
        eyebrow="vélos en atelier"
        title="Nouveau bon de travail"
        subline="Crée un BDT rattaché à un vélo existant."
      />

      <div className="mx-auto max-w-[720px] p-6">
        <Link
          href={`/${locale}/admin/bdcs`}
          className="mb-4 inline-block text-sm text-[var(--text-secondary-60)] no-underline hover:text-[var(--dark)]"
        >
          ← Inventaire
        </Link>

        {veloOptions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--gris-bord)] p-6 text-center">
            <p className="mb-3 text-sm text-[var(--text-secondary-70)]">
              Aucun vélo dans l&apos;atelier — un BDT ne peut être créé sans vélo.
            </p>
            <Link
              href={`/${locale}/admin/velos/new`}
              className="inline-flex h-9 items-center rounded-full bg-[var(--jaune)] px-4 text-xs font-bold uppercase tracking-wider text-black hover:bg-[var(--jaune-h)]"
            >
              + Créer un vélo
            </Link>
          </div>
        ) : (
          <NewBdtForm velos={veloOptions} defaultVeloId={sp.veloId ?? null} />
        )}
      </div>
    </div>
  );
}
