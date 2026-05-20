import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { Prisma, type VeloStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';
import { Pill } from '@/components/ui/pill';
import { ToolbarBlock, AddButton } from '@/components/ui/toolbar';
import { SearchBar } from '../_components/search-bar';
import { VELO_STATUS_LABELS } from '@/lib/velo/status-labels';

type PillVariant = 'rv' | 'recu' | 'eval' | 'attente' | 'approuve' | 'on-bench' | 'ctrl-qlte' | 'fini' | 'facturer' | 'facture' | 'livre';

const STATUS_TO_PILL: Record<VeloStatus, PillVariant> = {
  RV: 'rv', RECU: 'recu', EVAL: 'eval', EN_ATTENTE: 'attente', APPROUVE: 'approuve',
  ON_BENCH: 'on-bench', CTRL_QLTE: 'ctrl-qlte', FINI: 'fini', FACTURER: 'facturer',
  FACTURE: 'facture', LIVRE: 'livre',
};

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
};

export default async function ClientsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { q } = await searchParams;
  setRequestLocale(locale);

  const workshop = await getActiveWorkshop();
  if (!workshop) return <p className="p-6 text-[var(--text-secondary-60)]">Aucun workshop actif.</p>;

  const trimmed = q?.trim() ?? '';
  const where: Prisma.ClientWhereInput = {
    workshopId: workshop.id,
    deletedAt: null,
    ...(trimmed
      ? {
          OR: [
            { nom: { contains: trimmed, mode: 'insensitive' } },
            { prenom: { contains: trimmed, mode: 'insensitive' } },
            { courriel: { contains: trimmed, mode: 'insensitive' } },
            { telephone: { contains: trimmed, mode: 'insensitive' } },
            { notes: { contains: trimmed, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const clients = await prisma.client.findMany({
    where,
    orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
    include: {
      _count: { select: { velos: true } },
      velos: {
        where: { deletedAt: null, bdcs: { some: { archiveStatus: 'ACTIF', deletedAt: null } } },
        orderBy: { updatedAt: 'desc' },
        take: 1,
        select: {
          status: true,
          bdcs: {
            where: { archiveStatus: 'ACTIF', deletedAt: null },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { numero: true },
          },
        },
      },
    },
  });

  // V1 (capture 5-clients-v1.png) : liste alpha continue, pas de sections
  // groupées par lettre. Le tri vient déjà de Prisma (orderBy nom asc).
  // Pas de regroupement explicite — la première lettre change implicitement
  // au fil du scroll.

  return (
    <div>
      <PageHeader
        eyebrow="atelier"
        title="Clients"
        subline={`${clients.length} client${clients.length === 1 ? '' : 's'}${trimmed ? ` filtré sur « ${trimmed} »` : ''}`}
        actions={
          <ToolbarBlock>
            <SearchBar placeholder="Nom, courriel, tél, notes…" />
            <a href="/api/admin/export/clients" className="btn-secondary" style={{ height: '32px', padding: '0 14px', fontSize: '11px' }}>
              ↓ CSV
            </a>
            <Link href={`/${locale}/admin/clients/import`} className="btn-secondary" style={{ height: '32px', padding: '0 14px', fontSize: '11px' }}>
              ↑ Import
            </Link>
            <AddButton href={`/${locale}/admin/clients/new`} title="Nouveau client" />
          </ToolbarBlock>
        }
      />

      <div className="bloc-contenu p-6">
        {clients.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--gris-bord)] p-8 text-center text-sm text-[var(--text-secondary-60)]">
            Aucun client {trimmed ? `pour « ${trimmed} »` : ''}.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-white/85 shadow-sm">
            <table className="ds-table">
              <thead className="border-b border-[var(--gris-bord)] bg-white/50 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
                <tr>
                  <th className="px-3 py-2 text-left">Nom</th>
                  <th className="px-3 py-2 text-left">Téléphone</th>
                  <th className="px-3 py-2 text-left">Courriel</th>
                  <th className="px-3 py-2 text-left">Lang</th>
                  <th className="px-3 py-2 text-left">Comm.</th>
                  <th className="px-3 py-2 text-left">Lead</th>
                  <th className="px-3 py-2 text-right">Remise</th>
                  <th className="px-3 py-2 text-right">Vélos</th>
                  <th className="px-3 py-2 text-left">Notes</th>
                  <th className="px-3 py-2 text-right">BDT actif</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => {
                  const activeVelo = c.velos[0];
                  const activeBdc = activeVelo?.bdcs[0];
                  return (
                    <tr key={c.id} className="odd:bg-white/85 even:bg-white/70 border-t border-[var(--gris-bord)]/30 hover:bg-[var(--gris-fond)]">
                      <td className="px-3 py-2">
                        <Link href={`/${locale}/admin/clients/${c.id}`} className="font-semibold text-[var(--dark)] hover:underline">
                          {c.prenom} {c.nom}
                        </Link>
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {c.telephone ? `${c.indicatif} ${c.telephone}` : '—'}
                      </td>
                      <td className="px-3 py-2 text-xs">{c.courriel ?? '—'}</td>
                      <td className="px-3 py-2">{c.lang}</td>
                      <td className="px-3 py-2 text-xs">{c.commPref}</td>
                      <td className="px-3 py-2 text-xs">{c.lead ?? '—'}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {c.remiseDefault ? `${Number(c.remiseDefault)} %` : '—'}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{c._count.velos}</td>
                      <td className="px-3 py-2 max-w-[200px] truncate text-xs text-[var(--text-secondary-70)]" title={c.notes ?? ''}>
                        {c.notes ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {activeBdc && activeVelo ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="font-mono text-[11px] text-[var(--text-secondary-70)]">
                              {String(activeBdc.numero).padStart(4, '0')}
                            </span>
                            <Pill variant={STATUS_TO_PILL[activeVelo.status]} size="sm">
                              {VELO_STATUS_LABELS[activeVelo.status].fr}
                            </Pill>
                          </span>
                        ) : (
                          <span className="text-[var(--text-secondary-50)]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
