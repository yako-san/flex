import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { Prisma, type VeloStatus } from '@prisma/client';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';
import { Pill } from '@/components/ui/pill';
import { SearchBar } from '../_components/search-bar';
import { VELO_STATUS_LABELS, VELO_STATUS_COLORS } from '@/lib/velo/status-labels';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
};

type SectionKey = 'nouveau' | 'en-cours' | 'facture' | 'livre';

type SectionDef = {
  key: SectionKey;
  label: string;
  statuses: VeloStatus[];
  order: number;
};

const SECTIONS: readonly SectionDef[] = [
  { key: 'nouveau',  label: 'Nouveau',  statuses: ['RV', 'RECU'],                                          order: 0 },
  { key: 'en-cours', label: 'En cours', statuses: ['EVAL', 'EN_ATTENTE', 'APPROUVE', 'ON_BENCH', 'CTRL_QLTE', 'FINI'], order: 1 },
  { key: 'facture',  label: 'Facturé',  statuses: ['FACTURER', 'FACTURE'],                                 order: 2 },
  { key: 'livre',    label: 'Livré',    statuses: ['LIVRE'],                                                order: 3 },
] as const;

const STATUS_TO_SECTION: Record<VeloStatus, SectionKey> = SECTIONS.reduce(
  (acc, sec) => {
    for (const s of sec.statuses) acc[s] = sec.key;
    return acc;
  },
  {} as Record<VeloStatus, SectionKey>,
);

const STATUS_TO_PILL: Record<VeloStatus, 'rv' | 'recu' | 'eval' | 'attente' | 'approuve' | 'on-bench' | 'ctrl-qlte' | 'fini' | 'facturer' | 'facture' | 'livre'> = {
  RV:         'rv',
  RECU:       'recu',
  EVAL:       'eval',
  EN_ATTENTE: 'attente',
  APPROUVE:   'approuve',
  ON_BENCH:   'on-bench',
  CTRL_QLTE:  'ctrl-qlte',
  FINI:       'fini',
  FACTURER:   'facturer',
  FACTURE:    'facture',
  LIVRE:      'livre',
};

export default async function BdcsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { q } = await searchParams;
  setRequestLocale(locale);

  const workshop = await getActiveWorkshop();
  if (!workshop) return <p className="p-6 text-[var(--text-secondary-60)]">Aucun workshop actif.</p>;

  const trimmed = q?.trim() ?? '';
  const numeroAsInt = trimmed && /^\d+$/.test(trimmed) ? Number(trimmed) : undefined;

  const where: Prisma.BdcWhereInput = {
    workshopId: workshop.id,
    deletedAt: null,
    ...(trimmed
      ? {
          OR: [
            { notes: { contains: trimmed, mode: Prisma.QueryMode.insensitive } },
            { velo: { modele: { contains: trimmed, mode: Prisma.QueryMode.insensitive } } },
            { velo: { numeroSerie: { contains: trimmed, mode: Prisma.QueryMode.insensitive } } },
            { velo: { client: { nom: { contains: trimmed, mode: Prisma.QueryMode.insensitive } } } },
            { velo: { client: { prenom: { contains: trimmed, mode: Prisma.QueryMode.insensitive } } } },
            { velo: { marque: { nom: { contains: trimmed, mode: Prisma.QueryMode.insensitive } } } },
            { factures: { some: { factureNumero: { contains: trimmed, mode: Prisma.QueryMode.insensitive } } } },
            ...(numeroAsInt !== undefined
              ? [{ numero: numeroAsInt }, { velo: { veloNumero: numeroAsInt } }]
              : []),
          ],
        }
      : {}),
  };

  const bdcs = await prisma.bdc.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      velo: {
        select: {
          veloNumero: true,
          modele: true,
          couleur: true,
          status: true,
          client: { select: { id: true, prenom: true, nom: true } },
          marque: { select: { nom: true } },
        },
      },
      _count: { select: { items: true } },
    },
  });

  const grouped = new Map<SectionKey, typeof bdcs>();
  for (const sec of SECTIONS) grouped.set(sec.key, []);
  for (const bdc of bdcs) {
    const key = STATUS_TO_SECTION[bdc.velo.status];
    grouped.get(key)?.push(bdc);
  }

  const totalShown = bdcs.length;

  return (
    <div>
      <PageHeader
        eyebrow="vélos en atelier"
        title="Inventaire"
        subline={`${totalShown} BDT${trimmed ? ` filtré sur « ${trimmed} »` : ''}`}
        actions={
          <>
            <SearchBar placeholder="N° vélo, client, modèle, marque, série, facture…" />
            <a
              href="/api/admin/export/bdcs"
              className="rounded-full border border-[var(--gris-bord)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary-60)] transition-colors hover:bg-[var(--gris-fond)]"
            >
              ↓ CSV
            </a>
            <Link
              href={`/${locale}/admin/bdcs/new`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--jaune)] text-black shadow-sm transition-colors hover:bg-[var(--jaune-h)]"
              title="Nouveau BDT"
              aria-label="Nouveau BDT"
            >
              <Plus size={20} />
            </Link>
          </>
        }
      />

      <div className="px-6 py-4">
        {totalShown === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--gris-bord)] p-8 text-center text-sm text-[var(--text-secondary-60)]">
            Aucun BDT {trimmed ? `pour la recherche « ${trimmed} »` : ''}.
          </p>
        ) : (
          <div className="space-y-6">
            {SECTIONS.map((sec) => {
              const items = grouped.get(sec.key) ?? [];
              if (items.length === 0) return null;
              return (
                <section key={sec.key}>
                  <h2 className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-secondary-60)]">
                    {sec.label} <span className="ml-2 font-normal opacity-60">({items.length})</span>
                  </h2>
                  <div className="overflow-x-auto rounded-2xl shadow-sm">
                    <table className="w-full border-separate border-spacing-y-0 text-sm">
                      <thead className="bg-white/50 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
                        <tr>
                          <th className="px-3 py-2 text-left">Statut</th>
                          <th className="px-3 py-2 text-left">BDT</th>
                          <th className="px-3 py-2 text-left">Vélo</th>
                          <th className="px-3 py-2 text-left">Client</th>
                          <th className="px-3 py-2 text-left">Description</th>
                          <th className="px-3 py-2 text-right">Items</th>
                          <th className="px-3 py-2 text-right">Services</th>
                          <th className="px-3 py-2 text-right">Pièces</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((b) => {
                          const colors = VELO_STATUS_COLORS[b.velo.status];
                          const pill = STATUS_TO_PILL[b.velo.status];
                          const label = VELO_STATUS_LABELS[b.velo.status].fr;
                          return (
                            <tr
                              key={b.id}
                              className="transition-opacity hover:opacity-90"
                              style={{ backgroundColor: colors.bg, color: colors.fg }}
                            >
                              <td className="px-3 py-2">
                                <Pill variant={pill} size="sm">{label}</Pill>
                              </td>
                              <td className="px-3 py-2 font-mono font-semibold">
                                <Link href={`/${locale}/admin/bdcs/${b.id}`} className="hover:underline">
                                  {String(b.numero).padStart(4, '0')}
                                </Link>
                              </td>
                              <td className="px-3 py-2 font-mono text-xs opacity-80">
                                {String(b.velo.veloNumero).padStart(4, '0')}
                              </td>
                              <td className="px-3 py-2">
                                {b.velo.client ? (
                                  <Link
                                    href={`/${locale}/admin/clients/${b.velo.client.id ?? ''}`}
                                    className="hover:underline"
                                  >
                                    {`${b.velo.client.prenom} ${b.velo.client.nom}`.trim()}
                                  </Link>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="px-3 py-2 truncate max-w-[260px]">
                                {[b.velo.marque?.nom, b.velo.modele, b.velo.couleur].filter(Boolean).join(', ') || '—'}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums">{b._count.items}</td>
                              <td className="px-3 py-2 text-right font-mono tabular-nums">{Number(b.totalServices).toFixed(2)}</td>
                              <td className="px-3 py-2 text-right font-mono tabular-nums">{Number(b.totalPieces).toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
