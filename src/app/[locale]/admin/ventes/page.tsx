import { setRequestLocale } from 'next-intl/server';
import { Prisma } from '@prisma/client';
import { Eye, FileText } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';
import { Pill } from '@/components/ui/pill';
import { ToolbarBlock, AddButton } from '@/components/ui/toolbar';
import { SearchBar } from '../_components/search-bar';
import { ActionIcon } from './_action-icon';
import { PayeeToggleButton } from './_payee-toggle-button';
import { ArchiveVenteButton } from './_archive-vente-button';

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
      items: {
        orderBy: { position: 'asc' },
        select: {
          id: true,
          position: true,
          nomSnapshot: true,
          skuSnapshot: true,
          qty: true,
          unitPriceSnapshot: true,
          total: true,
          taxableSnapshot: true,
        },
      },
    },
  });

  const total = ventes.reduce((acc, v) => acc + Number(v.totalPieces), 0);
  const dateFmt = new Intl.DateTimeFormat('fr-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });

  return (
    <div>
      <PageHeader
        eyebrow="comptoir"
        title="Ventes directes"
        subline={`${ventes.length} vente${ventes.length === 1 ? '' : 's'} · ${total.toFixed(2)} $${trimmed ? ` filtré sur « ${trimmed} »` : ''}`}
        actions={
          <ToolbarBlock>
            <SearchBar placeholder="Facture, client, notes…" />
            <a href="/api/admin/export/ventes" className="btn-secondary" style={{ height: '32px', padding: '0 14px', fontSize: '11px' }}>
              ↓ CSV
            </a>
            <AddButton href={`/${locale}/admin/ventes/new`} title="Nouvelle vente" />
          </ToolbarBlock>
        }
      />

      <div className="bloc-contenu p-6">
        {ventes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--gris-bord)] p-8 text-center text-sm text-[var(--text-secondary-60)]">
            Aucune vente {trimmed ? `pour « ${trimmed} »` : ''}.
          </p>
        ) : (
          <div className="space-y-2">
            {ventes.map((v) => {
              const facture = !!v.factureNumero;
              const paid = facture && !!v.paidAt;
              // V1 : 3 états visuels selon (facture, paid). Brouillon = jaune
              // saillant (action requise), facturée pas payée = blanc neutre
              // (livré, en attente paiement), payée = gris archivable (cycle
              // terminé).
              const cardBg = !facture
                ? 'bg-[var(--jaune)] ring-2 ring-[var(--jaune-h)]'
                : paid
                  ? 'bg-[#e0e0e0]/85'
                  : 'bg-white/85';
              const clientLabel = v.client ? `${v.client.prenom} ${v.client.nom}`.trim() : 'walk-in';
              return (
                <details
                  key={v.id}
                  className={`rounded-2xl px-4 py-3 shadow-sm transition-colors ${cardBg}`}
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-3 list-none">
                    <span className="flex items-baseline gap-3 min-w-0">
                      <span className="font-mono font-semibold">
                        {v.factureNumero ?? <span className="text-[var(--text-secondary-60)]">brouillon</span>}
                      </span>
                      <span className="text-xs text-[var(--text-secondary-60)]">
                        {dateFmt.format(v.date)}
                      </span>
                      {/* Pill 3-états (cluster 4 item m) */}
                      {!facture ? (
                        <Pill variant="rv" size="sm">à facturer</Pill>
                      ) : !paid ? (
                        <Pill
                          variant="neutral"
                          size="sm"
                          className="bg-[var(--overlay-light-50)] text-[var(--dark)]"
                        >
                          facture envoyée
                        </Pill>
                      ) : (
                        <Pill variant="livre" size="sm">payée</Pill>
                      )}
                      <span className="truncate text-xs text-[var(--text-secondary-70)]">
                        {clientLabel}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-mono">
                        {v.items.length} item{v.items.length === 1 ? '' : 's'}
                      </span>
                      <span className="font-mono text-sm font-semibold tabular-nums">
                        {Number(v.totalPieces).toFixed(2)} $
                      </span>
                      {/* 4 boutons icône V1 — ouvrir / PDF / payée / archiver */}
                      <ActionIcon
                        href={`/${locale}/admin/ventes/${v.id}`}
                        title="Ouvrir la vente"
                        icon={<Eye size={14} />}
                      />
                      <ActionIcon
                        href={facture ? `/api/admin/factures/${v.id}/pdf` : undefined}
                        title={facture ? 'PDF facture' : 'PDF — disponible une fois facturée'}
                        icon={<FileText size={14} />}
                        disabled={!facture}
                        target="_blank"
                      />
                      <PayeeToggleButton venteId={v.id} initialPaid={paid} facture={facture} />
                      <ArchiveVenteButton venteId={v.id} facture={facture} paid={paid} />
                    </span>
                  </summary>

                  {/* Détail items inline V1 */}
                  <div className="mt-3 overflow-x-auto rounded-xl bg-white/85 shadow-inner">
                    {v.items.length === 0 ? (
                      <p className="px-4 py-3 text-center text-[11px] italic text-[var(--text-secondary-60)]">
                        Aucun item.
                      </p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
                          <tr>
                            <th className="px-3 py-1.5 text-left">SKU</th>
                            <th className="px-3 py-1.5 text-left">Désignation</th>
                            <th className="px-3 py-1.5 text-right">Qté</th>
                            <th className="px-3 py-1.5 text-right">Unitaire</th>
                            <th className="px-3 py-1.5 text-center">Taxe</th>
                            <th className="px-3 py-1.5 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {v.items.map((it) => (
                            <tr key={it.id} className="odd:bg-white/85 even:bg-white/70 border-t border-black/5">
                              <td className="px-3 py-1.5 font-mono text-[10px] text-[var(--text-secondary-60)]">
                                {it.skuSnapshot ?? '—'}
                              </td>
                              <td className="px-3 py-1.5">{it.nomSnapshot}</td>
                              <td className="px-3 py-1.5 text-right tabular-nums">{Number(it.qty)}</td>
                              <td className="px-3 py-1.5 text-right font-mono tabular-nums">
                                {Number(it.unitPriceSnapshot).toFixed(2)} $
                              </td>
                              <td className="px-3 py-1.5 text-center">{it.taxableSnapshot ? '✓' : '—'}</td>
                              <td className="px-3 py-1.5 text-right font-mono tabular-nums font-semibold">
                                {Number(it.total).toFixed(2)} $
                              </td>
                            </tr>
                          ))}
                          <tr className="border-t-2 border-black/10 bg-black/[0.03]">
                            <td colSpan={5} className="px-3 py-1.5 text-right text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-70)]">
                              Total
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono tabular-nums font-bold">
                              {Number(v.totalPieces).toFixed(2)} $
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

