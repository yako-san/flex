import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import Decimal from 'decimal.js';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { calcQuebecTaxes } from '@/lib/billing/quebec-taxes';
import { PageHeader } from '@/components/ui/page-header';
import { Pill } from '@/components/ui/pill';
import { AddItemForm } from './add-item-form';
import { RemoveItemButton } from './remove-item-button';
import { EmitFactureButton } from './emit-facture-button';
import { DeleteVenteButton } from './delete-vente-button';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function VenteDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const workshop = await getActiveWorkshop();
  if (!workshop) return <p className="p-6 text-[var(--text-secondary-60)]">Aucun workshop actif.</p>;

  const vente = await prisma.venteDirecte.findFirst({
    where: { id, workshopId: workshop.id, deletedAt: null },
    include: {
      client: { select: { id: true, prenom: true, nom: true } },
      items: { orderBy: { position: 'asc' } },
    },
  });
  if (!vente) notFound();

  const pieces = vente.factureNumero
    ? []
    : await prisma.piece.findMany({
        where: { workshopId: workshop.id, deletedAt: null },
        orderBy: [{ nomCanonical: 'asc' }],
        select: { id: true, nomCanonical: true, sku: true, prixVente: true, taxable: true },
      });

  const taxLines = vente.items.map((it) => ({
    amount: new Decimal(it.total.toString()),
    taxable: it.taxableSnapshot,
  }));
  const tax = calcQuebecTaxes(taxLines);
  const facturee = !!vente.factureNumero;

  return (
    <div>
      <PageHeader
        eyebrow="comptoir · vente directe"
        title={facturee ? <span className="font-mono">{vente.factureNumero}</span> : 'Vente brouillon'}
        subline={
          <span className="flex flex-wrap items-center gap-2">
            {facturee ? (
              <Pill variant="facture" size="sm">facturée</Pill>
            ) : (
              <Pill variant="facturer" size="sm">à facturer</Pill>
            )}
            <span>{vente.client ? `${vente.client.prenom} ${vente.client.nom}` : 'Walk-in'}</span>
            <span className="opacity-60">·</span>
            <span>{vente.date.toLocaleDateString('fr-CA')}</span>
            {facturee && vente.factureDate ? (
              <>
                <span className="opacity-60">·</span>
                <span>Facturée {vente.factureDate.toLocaleDateString('fr-CA')}</span>
              </>
            ) : null}
          </span>
        }
        actions={
          !facturee ? (
            <>
              <EmitFactureButton venteId={vente.id} disabled={vente.items.length === 0} />
              <DeleteVenteButton venteId={vente.id} />
            </>
          ) : null
        }
      />

      <div className="mx-auto max-w-[960px] space-y-4 p-6">
        <Link
          href={`/${locale}/admin/ventes`}
          className="inline-block text-sm text-[var(--text-secondary-60)] hover:text-[var(--dark)]"
        >
          ← Toutes les ventes
        </Link>

        {vente.notes ? (
          <div className="rounded-2xl border border-[var(--jaune)]/40 bg-[var(--jaune)]/10 px-4 py-2 text-sm">
            <strong>Notes :</strong> {vente.notes}
          </div>
        ) : null}

        <section className="overflow-x-auto rounded-2xl bg-white/85 shadow-sm">
          <header className="flex items-center justify-between bg-[var(--gris-fond)] px-4 py-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
              Items
            </h2>
            <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-mono">{vente.items.length}</span>
          </header>
          <table className="w-full text-xs">
            <thead className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
              <tr>
                <th className="px-3 py-1.5 text-left">#</th>
                <th className="px-3 py-1.5 text-left">SKU</th>
                <th className="px-3 py-1.5 text-left">Description</th>
                <th className="px-3 py-1.5 text-right">Qté</th>
                <th className="px-3 py-1.5 text-right">Prix unit.</th>
                <th className="px-3 py-1.5 text-center">Tax.</th>
                <th className="px-3 py-1.5 text-right">Total</th>
                <th className="px-3 py-1.5" />
              </tr>
            </thead>
            <tbody>
              {vente.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-[var(--text-secondary-60)] italic">
                    Aucun item. Ajoute une pièce ci-dessous.
                  </td>
                </tr>
              ) : (
                vente.items.map((it) => (
                  <tr key={it.id} className="border-t border-black/5 hover:bg-[var(--gris-fond)]">
                    <td className="px-3 py-1.5 font-mono text-[10px] text-[var(--text-secondary-60)]">{it.position}</td>
                    <td className="px-3 py-1.5 font-mono text-[10px]">{it.skuSnapshot ?? '—'}</td>
                    <td className="px-3 py-1.5">{it.nomSnapshot}</td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums">{Number(it.qty)}</td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums">{Number(it.unitPriceSnapshot).toFixed(2)} $</td>
                    <td className="px-3 py-1.5 text-center">{it.taxableSnapshot ? '✓' : '—'}</td>
                    <td className="px-3 py-1.5 text-right font-mono font-semibold tabular-nums">{Number(it.total).toFixed(2)} $</td>
                    <td className="px-3 py-1.5 text-right">
                      {!facturee ? <RemoveItemButton itemId={it.id} /> : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[var(--gris-bord)] bg-[var(--gris-fond)]">
                <td colSpan={6} className="px-3 py-1.5 text-right">Sous-total</td>
                <td className="px-3 py-1.5 text-right font-mono tabular-nums">{tax.subtotal.toFixed(2)} $</td>
                <td />
              </tr>
              <tr className="bg-[var(--gris-fond)]">
                <td colSpan={6} className="px-3 py-1 text-right text-[var(--text-secondary-60)]">TPS (5 %)</td>
                <td className="px-3 py-1 text-right font-mono text-[var(--text-secondary-60)] tabular-nums">{tax.tps.toFixed(2)} $</td>
                <td />
              </tr>
              <tr className="bg-[var(--gris-fond)]">
                <td colSpan={6} className="px-3 py-1 text-right text-[var(--text-secondary-60)]">TVQ (9,975 %)</td>
                <td className="px-3 py-1 text-right font-mono text-[var(--text-secondary-60)] tabular-nums">{tax.tvq.toFixed(2)} $</td>
                <td />
              </tr>
              <tr className="border-t border-[var(--gris-bord)] bg-[var(--gris-fond)]">
                <td colSpan={6} className="px-3 py-2 text-right font-bold">Grand total</td>
                <td className="px-3 py-2 text-right font-mono font-bold tabular-nums">{tax.total.toFixed(2)} $</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </section>

        {!facturee ? (
          <section className="rounded-2xl bg-white/85 p-4 shadow-sm">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
              Ajouter une pièce
            </h2>
            <AddItemForm venteId={vente.id} pieces={pieces.map((p) => ({
              id: p.id,
              label: `${p.sku ? `[${p.sku}] ` : ''}${p.nomCanonical} — ${Number(p.prixVente).toFixed(2)} $`,
            }))} />
          </section>
        ) : null}
      </div>
    </div>
  );
}
