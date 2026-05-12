import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { Prisma } from '@prisma/client';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';
import { Pill } from '@/components/ui/pill';
import { SearchBar } from '../_components/search-bar';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
};

export default async function VentesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { q } = await searchParams;
  setRequestLocale(locale);
  const workshop = await getActiveWorkshop();
  if (!workshop) return <p className="p-6 text-[var(--text-secondary-60)]">Aucun workshop actif.</p>;

  const trimmed = q?.trim() ?? '';
  const where: Prisma.VenteDirecteWhereInput = {
    workshopId: workshop.id,
    deletedAt: null,
    ...(trimmed
      ? {
          OR: [
            { factureNumero: { contains: trimmed, mode: 'insensitive' } },
            { notes: { contains: trimmed, mode: 'insensitive' } },
            { client: { nom: { contains: trimmed, mode: 'insensitive' } } },
            { client: { prenom: { contains: trimmed, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const ventes = await prisma.venteDirecte.findMany({
    where,
    orderBy: [{ factureNumero: 'desc' }, { date: 'desc' }],
    include: {
      client: { select: { id: true, prenom: true, nom: true } },
      _count: { select: { items: true } },
    },
  });

  const total = ventes.reduce((acc, v) => acc + Number(v.totalPieces), 0);

  return (
    <div>
      <PageHeader
        eyebrow="comptoir"
        title="Ventes directes"
        subline={`${ventes.length} vente${ventes.length === 1 ? '' : 's'} · ${total.toFixed(2)} $${trimmed ? ` filtré sur « ${trimmed} »` : ''}`}
        actions={
          <>
            <SearchBar placeholder="Facture, client, notes…" />
            <a
              href="/api/admin/export/ventes"
              className="rounded-full border border-[var(--gris-bord)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary-60)] hover:bg-[var(--gris-fond)]"
            >
              ↓ CSV
            </a>
            <Link
              href={`/${locale}/admin/ventes/new`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--jaune)] text-black shadow-sm transition-colors hover:bg-[var(--jaune-h)]"
              aria-label="Nouvelle vente"
              title="Nouvelle vente"
            >
              <Plus size={20} />
            </Link>
          </>
        }
      />

      <div className="p-6">
        {ventes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--gris-bord)] p-8 text-center text-sm text-[var(--text-secondary-60)]">
            Aucune vente {trimmed ? `pour « ${trimmed} »` : ''}.
          </p>
        ) : (
          <div className="space-y-2">
            {ventes.map((v) => {
              const facture = !!v.factureNumero;
              return (
                <Link
                  key={v.id}
                  href={`/${locale}/admin/ventes/${v.id}`}
                  className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 shadow-sm transition-colors ${
                    facture ? 'bg-[var(--st-facture-bg)]/40 hover:bg-[var(--st-facture-bg)]/60' : 'bg-white/85 hover:bg-white/95'
                  }`}
                >
                  <span className="flex items-baseline gap-3">
                    <span className="font-mono font-semibold">
                      {v.factureNumero ?? <span className="text-[var(--text-secondary-60)]">brouillon</span>}
                    </span>
                    <span className="text-xs text-[var(--text-secondary-60)]">
                      {v.date.toLocaleDateString('fr-CA')}
                    </span>
                    {facture ? (
                      <Pill variant="facture" size="sm">facturée</Pill>
                    ) : (
                      <Pill variant="facturer" size="sm">à facturer</Pill>
                    )}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-xs text-[var(--text-secondary-70)]">
                      {v.client ? `${v.client.prenom} ${v.client.nom}` : 'walk-in'}
                    </span>
                    <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-mono">
                      {v._count.items} items
                    </span>
                    <span className="font-mono text-sm font-semibold tabular-nums">
                      {Number(v.totalPieces).toFixed(2)} $
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
