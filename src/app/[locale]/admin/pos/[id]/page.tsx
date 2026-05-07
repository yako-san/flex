import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { ReceivePoButton } from './receive-button';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function PoDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const workshop = await getActiveWorkshop();
  if (!workshop) return <p>Aucun workshop actif.</p>;

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

  return (
    <div style={{ maxWidth: 960 }}>
      <Link href={`/${locale}/admin/pos`} style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1rem' }}>← Tous les POs</Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem', fontFamily: 'monospace' }}>{po.poNumero}</h1>
          <p style={{ color: '#666', margin: 0 }}>{po.fournisseur}</p>
        </div>
        {po.status !== 'RECU' ? (
          <ReceivePoButton poId={po.id} poNumero={po.poNumero} />
        ) : (
          <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '0.5rem 1rem', borderRadius: 4, fontWeight: 600 }}>
            ✓ Reçu le {po.dateReception?.toLocaleDateString('fr-CA')}
          </span>
        )}
      </div>

      <h2 style={h2}>Items ({po.items.length})</h2>
      <table style={tbl}>
        <thead>
          <tr style={{ background: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
            <th style={th}>#</th>
            <th style={th}>SKU</th>
            <th style={th}>Description</th>
            <th style={th}>Pièce liée</th>
            <th style={{ ...th, textAlign: 'right' }}>Qté cmd</th>
            <th style={{ ...th, textAlign: 'right' }}>Qté reçue</th>
            <th style={{ ...th, textAlign: 'right' }}>Prix achat</th>
            <th style={{ ...th, textAlign: 'right' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {po.items.map((it) => (
            <tr key={it.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={td}>{it.position}</td>
              <td style={{ ...td, fontFamily: 'monospace', fontSize: '0.8rem' }}>{it.skuSnapshot ?? '—'}</td>
              <td style={td}>{it.nomSnapshot}</td>
              <td style={{ ...td, fontSize: '0.85rem' }}>
                {it.piece ? (
                  <Link href={`/${locale}/admin/pieces/${it.piece.id}/edit`} style={{ color: '#1565c0', textDecoration: 'none' }}>
                    {it.piece.nomCanonical.slice(0, 40)}
                  </Link>
                ) : <span style={{ color: '#888' }}>(pas mappée)</span>}
              </td>
              <td style={{ ...td, textAlign: 'right', fontFamily: 'monospace' }}>{Number(it.qtyCommandee)}</td>
              <td style={{ ...td, textAlign: 'right', fontFamily: 'monospace', color: Number(it.qtyRecue) === Number(it.qtyCommandee) ? '#2e7d32' : '#888' }}>
                {Number(it.qtyRecue)}
              </td>
              <td style={{ ...td, textAlign: 'right', fontFamily: 'monospace' }}>{Number(it.unitPrice).toFixed(2)} $</td>
              <td style={{ ...td, textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                {(Number(it.qtyCommandee) * Number(it.unitPrice)).toFixed(2)} $
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: '2px solid #e0e0e0', background: '#fafafa' }}>
            <td colSpan={7} style={{ ...td, textAlign: 'right', fontWeight: 700 }}>Total HT</td>
            <td style={{ ...td, textAlign: 'right', fontWeight: 700, fontFamily: 'monospace' }}>{total.toFixed(2)} $</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

const h2: React.CSSProperties = { fontSize: '1.15rem', marginBottom: '0.75rem' };
const tbl: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' };
const th: React.CSSProperties = { textAlign: 'left', padding: '0.5rem 0.6rem', fontWeight: 600, color: '#666', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' };
const td: React.CSSProperties = { padding: '0.5rem 0.6rem' };
