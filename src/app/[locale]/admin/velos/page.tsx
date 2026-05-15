import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';
import { Pill } from '@/components/ui/pill';
import { ToolbarBlock, AddButton } from '@/components/ui/toolbar';
import { SearchBar } from '../_components/search-bar';
import { VELO_STATUS_LABELS } from '@/lib/velo/status-labels';
import type { VeloStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

const STATUS_TO_PILL: Record<VeloStatus, 'rv' | 'recu' | 'eval' | 'attente' | 'approuve' | 'on-bench' | 'ctrl-qlte' | 'fini' | 'facturer' | 'facture' | 'livre'> = {
  RV: 'rv',
  RECU: 'recu',
  EVAL: 'eval',
  EN_ATTENTE: 'attente',
  APPROUVE: 'approuve',
  ON_BENCH: 'on-bench',
  CTRL_QLTE: 'ctrl-qlte',
  FINI: 'fini',
  FACTURER: 'facturer',
  FACTURE: 'facture',
  LIVRE: 'livre',
};

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
};

export default async function VelosPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { q } = await searchParams;
  setRequestLocale(locale);

  const workshop = await getActiveWorkshop();
  if (!workshop) return <p className="p-6 text-[var(--text-secondary-60)]">Aucun workshop actif.</p>;

  const trimmed = q?.trim() ?? '';
  const numeroAsInt = trimmed && /^\d+$/.test(trimmed) ? Number(trimmed) : undefined;

  const where: Prisma.VeloWhereInput = {
    workshopId: workshop.id,
    deletedAt: null,
    ...(trimmed
      ? {
          OR: [
            { modele: { contains: trimmed, mode: 'insensitive' } },
            { couleur: { contains: trimmed, mode: 'insensitive' } },
            { taille: { contains: trimmed, mode: 'insensitive' } },
            { numeroSerie: { contains: trimmed, mode: 'insensitive' } },
            { notes: { contains: trimmed, mode: 'insensitive' } },
            { client: { nom: { contains: trimmed, mode: 'insensitive' } } },
            { client: { prenom: { contains: trimmed, mode: 'insensitive' } } },
            { marque: { nom: { contains: trimmed, mode: 'insensitive' } } },
            ...(numeroAsInt !== undefined ? [{ veloNumero: numeroAsInt }] : []),
          ],
        }
      : {}),
  };

  const velos = await prisma.velo.findMany({
    where,
    orderBy: { veloNumero: 'desc' },
    include: {
      client: { select: { id: true, prenom: true, nom: true } },
      marque: { select: { nom: true } },
      _count: { select: { bdcs: true } },
    },
  });

  return (
    <div>
      <PageHeader
        eyebrow="catalogue"
        title="Vélos"
        subline={`${velos.length} vélo${velos.length === 1 ? '' : 's'}${trimmed ? ` filtré sur « ${trimmed} »` : ''}`}
        actions={
          <ToolbarBlock>
            <SearchBar placeholder="N°, modèle, marque, client, série…" />
            <a href="/api/admin/export/velos" className="btn-secondary" style={{ height: '32px', padding: '0 14px', fontSize: '11px' }}>
              ↓ CSV
            </a>
            <AddButton href={`/${locale}/admin/velos/new`} title="Nouveau vélo" />
          </ToolbarBlock>
        }
      />

      <div className="p-6">
        {velos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--gris-bord)] p-8 text-center text-sm text-[var(--text-secondary-60)]">
            Aucun vélo {trimmed ? `pour « ${trimmed} »` : ''}.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-white/85 shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--gris-bord)] bg-white/50 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Statut</th>
                  <th className="px-3 py-2 text-left">Client</th>
                  <th className="px-3 py-2 text-left">Marque</th>
                  <th className="px-3 py-2 text-left">Modèle</th>
                  <th className="px-3 py-2 text-left">Couleur</th>
                  <th className="px-3 py-2 text-left">Taille</th>
                  <th className="px-3 py-2 text-right">BDT</th>
                </tr>
              </thead>
              <tbody>
                {velos.map((v) => (
                  <tr key={v.id} className="border-t border-[var(--gris-bord)]/30 hover:bg-[var(--gris-fond)]">
                    <td className="px-3 py-2 font-mono font-semibold">
                      <Link href={`/${locale}/admin/velos/${v.id}`} className="hover:underline">
                        {String(v.veloNumero).padStart(4, '0')}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <Pill variant={STATUS_TO_PILL[v.status]} size="sm">
                        {VELO_STATUS_LABELS[v.status].fr}
                      </Pill>
                    </td>
                    <td className="px-3 py-2">
                      {v.client ? (
                        <Link href={`/${locale}/admin/clients/${v.client.id}`} className="hover:underline">
                          {`${v.client.prenom} ${v.client.nom}`.trim()}
                        </Link>
                      ) : (
                        <span className="text-[var(--text-secondary-60)]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">{v.marque?.nom ?? '—'}</td>
                    <td className="px-3 py-2">{v.modele ?? '—'}</td>
                    <td className="px-3 py-2">{v.couleur ?? '—'}</td>
                    <td className="px-3 py-2">{v.taille ?? '—'}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{v._count.bdcs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
