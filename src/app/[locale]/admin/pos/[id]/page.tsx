import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';
import { Pill } from '@/components/ui/pill';
import { ReceivePoButton } from './receive-button';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, { label: string; variant: 'on-bench' | 'attente' | 'facture' | 'approuve' | 'livre' }> = {
  EN_ATTENTE: { label: 'En attente', variant: 'attente' },
  PARTIEL:    { label: 'Partiel', variant: 'facture' },
  RECU:       { label: 'Reçu', variant: 'approuve' },
  ANNULE:     { label: 'Annulé', variant: 'livre' },
};

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function PoDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const workshop = await getActiveWorkshop();
  if (!workshop) return <p className="p-6 text-[var(--text-secondary-60)]">Aucun workshop actif.</p>;

  const po = await prisma.po.findFirst({
    where: { id, workshopId: workshop.id, deletedAt: null },
    include: {
      items: {
        orderBy: { position: 'asc' },
        include: { piece: { select: { id: true, nomCanonical: true, sku: true } } },
      },
    },
  });
  if (!po) notFound();

  const total = po.items.reduce((acc, it) => acc + Number(it.qtyCommandee) * Number(it.unitPrice), 0);
  const totalRecu = po.items.reduce((acc, it) => acc + Number(it.qtyRecue), 0);
  const totalCmd = po.items.reduce((acc, it) => acc + Number(it.qtyCommandee), 0);
  const sc = STATUS_LABEL[po.status] ?? { label: po.status, variant: 'livre' as const };

  return (
    <div>
      <PageHeader
        eyebrow={`commandes fournisseurs · ${po.fournisseur}`}
        title={<span className="font-mono">#{po.poNumero}</span>}
        subline={
          <span className="flex flex-wrap items-center gap-2">
            <Pill variant={sc.variant} size="sm">{sc.label}</Pill>
            <span className="text-xs opacity-60">·</span>
            <span>Cmd {po.dateCommande.toLocaleDateString('fr-CA')}</span>
            {po.dateReception ? (
              <>
                <span className="opacity-60">·</span>
                <span>Reçu {po.dateReception.toLocaleDateString('fr-CA')}</span>
              </>
            ) : null}
            <span className="opacity-60">·</span>
            <span className="font-mono">{totalRecu}/{totalCmd} unités</span>
          </span>
        }
        actions={po.status !== 'RECU' ? <ReceivePoButton poId={po.id} poNumero={po.poNumero} /> : null}
      />

      <div className="mx-auto max-w-[1100px] p-6">
        <Link
          href={`/${locale}/admin/pos`}
          className="mb-4 inline-block text-sm text-[var(--text-secondary-60)] hover:text-[var(--dark)]"
        >
          ← Tous les POs
        </Link>

        <section className="overflow-x-auto rounded-2xl bg-white/85 shadow-sm">
          <header className="flex items-center justify-between bg-[var(--gris-fond)] px-4 py-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
              Items
            </h2>
            <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-mono">{po.items.length}</span>
          </header>
          <table className="w-full text-xs">
            <thead className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
              <tr>
                <th className="px-3 py-1.5 text-left">#</th>
                <th className="px-3 py-1.5 text-left">SKU</th>
                <th className="px-3 py-1.5 text-left">Description</th>
                <th className="px-3 py-1.5 text-left">Pièce liée</th>
                <th className="px-3 py-1.5 text-right">Cmd</th>
                <th className="px-3 py-1.5 text-right">Reçu</th>
                <th className="px-3 py-1.5 text-right">Prix</th>
                <th className="px-3 py-1.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {po.items.map((it) => {
                const qcm = Number(it.qtyCommandee);
                const qrc = Number(it.qtyRecue);
                const complet = qrc >= qcm && qcm > 0;
                return (
                  <tr
                    key={it.id}
                    className="odd:bg-white/85 even:bg-white/70 border-t border-black/5 hover:bg-[var(--gris-fond)]"
                    style={complet ? { backgroundColor: 'var(--st-approuve-bg)' } : undefined}
                  >
                    <td className="px-3 py-1.5 font-mono text-[10px] text-[var(--text-secondary-60)]">{it.position}</td>
                    <td className="px-3 py-1.5 font-mono text-[10px]">{it.skuSnapshot ?? '—'}</td>
                    <td className="px-3 py-1.5">{it.nomSnapshot}</td>
                    <td className="px-3 py-1.5">
                      {it.piece ? (
                        <Link
                          href={`/${locale}/admin/pieces/${it.piece.id}/edit`}
                          className="text-[var(--jaune-h)] hover:underline"
                        >
                          {it.piece.nomCanonical.slice(0, 40)}
                        </Link>
                      ) : (
                        <span className="text-[var(--text-secondary-60)] italic">(pas mappée)</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums">{qcm}</td>
                    <td className={`px-3 py-1.5 text-right font-mono tabular-nums ${complet ? 'font-semibold' : 'text-[var(--text-secondary-60)]'}`}>
                      {qrc}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums">{Number(it.unitPrice).toFixed(2)} $</td>
                    <td className="px-3 py-1.5 text-right font-mono font-semibold tabular-nums">
                      {(qcm * Number(it.unitPrice)).toFixed(2)} $
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[var(--gris-bord)] bg-[var(--gris-fond)]">
                <td colSpan={7} className="px-3 py-2 text-right font-semibold">Total HT</td>
                <td className="px-3 py-2 text-right font-mono font-bold tabular-nums">{total.toFixed(2)} $</td>
              </tr>
            </tfoot>
          </table>
        </section>
      </div>
    </div>
  );
}
