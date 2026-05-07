import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import Decimal from 'decimal.js';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { calcQuebecTaxes } from '@/lib/billing/quebec-taxes';
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
  if (!workshop) return <p>Aucun workshop actif.</p>;

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
    <div style={{ maxWidth: 960 }}>
      <Link href={`/${locale}/admin/ventes`} style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1rem' }}>
        ← Toutes les ventes
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>
            {facturee ? (
              <span style={{ fontFamily: 'monospace' }}>{vente.factureNumero}</span>
            ) : (
              <span>Vente brouillon</span>
            )}
          </h1>
          <p style={{ color: '#666', margin: 0 }}>
            {vente.client ? `${vente.client.prenom} ${vente.client.nom}` : 'Walk-in'}
            {' · '}
            {vente.date.toLocaleDateString('fr-CA')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {facturee ? (
            <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '0.5rem 1rem', borderRadius: 4, fontWeight: 600 }}>
              ✓ Facturée {vente.factureDate?.toLocaleDateString('fr-CA')}
            </span>
          ) : (
            <>
              <EmitFactureButton venteId={vente.id} disabled={vente.items.length === 0} />
              <DeleteVenteButton venteId={vente.id} />
            </>
          )}
        </div>
      </div>

      {vente.notes ? (
        <div style={{ background: '#fff8e1', border: '1px solid #ffe082', padding: '0.75rem 1rem', borderRadius: 4, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          <strong>Notes :</strong> {vente.notes}
        </div>
      ) : null}

      <h2 style={h2}>Items ({vente.items.length})</h2>
      <table style={tbl}>
        <thead>
          <tr style={{ background: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
            <th style={th}>#</th>
            <th style={th}>SKU</th>
            <th style={th}>Description</th>
            <th style={{ ...th, textAlign: 'right' }}>Qté</th>
            <th style={{ ...th, textAlign: 'right' }}>Prix unit.</th>
            <th style={{ ...th, textAlign: 'center' }}>Tax.</th>
            <th style={{ ...th, textAlign: 'right' }}>Total</th>
            <th style={{ ...th, textAlign: 'right' }}></th>
          </tr>
        </thead>
        <tbody>
          {vente.items.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ ...td, textAlign: 'center', color: '#888', padding: '1.5rem' }}>
                Aucun item. Ajoute une pièce ci-dessous.
              </td>
            </tr>
          ) : (
            vente.items.map((it) => (
              <tr key={it.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={td}>{it.position}</td>
                <td style={{ ...td, fontFamily: 'monospace', fontSize: '0.8rem' }}>{it.skuSnapshot ?? '—'}</td>
                <td style={td}>{it.nomSnapshot}</td>
                <td style={{ ...td, textAlign: 'right', fontFamily: 'monospace' }}>{Number(it.qty)}</td>
                <td style={{ ...td, textAlign: 'right', fontFamily: 'monospace' }}>{Number(it.unitPriceSnapshot).toFixed(2)} $</td>
                <td style={{ ...td, textAlign: 'center', fontSize: '0.8rem' }}>{it.taxableSnapshot ? '✓' : '—'}</td>
                <td style={{ ...td, textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{Number(it.total).toFixed(2)} $</td>
                <td style={{ ...td, textAlign: 'right' }}>
                  {!facturee ? <RemoveItemButton itemId={it.id} /> : null}
                </td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: '2px solid #e0e0e0', background: '#fafafa' }}>
            <td colSpan={6} style={{ ...td, textAlign: 'right' }}>Sous-total</td>
            <td style={{ ...td, textAlign: 'right', fontFamily: 'monospace' }}>{tax.subtotal.toFixed(2)} $</td>
            <td />
          </tr>
          <tr style={{ background: '#fafafa' }}>
            <td colSpan={6} style={{ ...td, textAlign: 'right', fontSize: '0.85rem', color: '#666' }}>TPS (5%)</td>
            <td style={{ ...td, textAlign: 'right', fontFamily: 'monospace', fontSize: '0.85rem' }}>{tax.tps.toFixed(2)} $</td>
            <td />
          </tr>
          <tr style={{ background: '#fafafa' }}>
            <td colSpan={6} style={{ ...td, textAlign: 'right', fontSize: '0.85rem', color: '#666' }}>TVQ (9.975%)</td>
            <td style={{ ...td, textAlign: 'right', fontFamily: 'monospace', fontSize: '0.85rem' }}>{tax.tvq.toFixed(2)} $</td>
            <td />
          </tr>
          <tr style={{ background: '#fafafa', borderTop: '1px solid #e0e0e0' }}>
            <td colSpan={6} style={{ ...td, textAlign: 'right', fontWeight: 700 }}>Grand total</td>
            <td style={{ ...td, textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{tax.total.toFixed(2)} $</td>
            <td />
          </tr>
        </tfoot>
      </table>

      {!facturee ? (
        <div style={{ marginTop: '2rem' }}>
          <h2 style={h2}>Ajouter une pièce</h2>
          <AddItemForm venteId={vente.id} pieces={pieces.map((p) => ({
            id: p.id,
            label: `${p.sku ? `[${p.sku}] ` : ''}${p.nomCanonical} — ${Number(p.prixVente).toFixed(2)} $`,
          }))} />
        </div>
      ) : null}
    </div>
  );
}

const h2: React.CSSProperties = { fontSize: '1.15rem', marginBottom: '0.75rem' };
const tbl: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' };
const th: React.CSSProperties = { textAlign: 'left', padding: '0.5rem 0.6rem', fontWeight: 600, color: '#666', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' };
const td: React.CSSProperties = { padding: '0.5rem 0.6rem' };
