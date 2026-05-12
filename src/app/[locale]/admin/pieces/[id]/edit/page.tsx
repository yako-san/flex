import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';
import { PieceForm } from '../../piece-form';
import { AdjustStockForm } from './adjust-form';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string; id: string }> };

const TYPE_LABEL: Record<string, string> = {
  PO_RECEIVED: 'Réception PO',
  BDC_INVOICED: 'Facturation BDT',
  SALE_INVOICED: 'Vente comptoir',
  MANUAL_ADJUSTMENT: 'Ajustement manuel',
  RESERVATION: 'Réservation',
  RELEASE: 'Libération réservation',
};

const TYPE_COLOR: Record<string, { bg: string; fg: string }> = {
  PO_RECEIVED: { bg: '#e8f5e9', fg: '#2e7d32' },
  BDC_INVOICED: { bg: '#ffebee', fg: '#c62828' },
  SALE_INVOICED: { bg: '#fce4ec', fg: '#ad1457' },
  MANUAL_ADJUSTMENT: { bg: '#fff8e1', fg: '#f57f17' },
  RESERVATION: { bg: '#e3f2fd', fg: '#1565c0' },
  RELEASE: { bg: '#eceff1', fg: '#455a64' },
};

export default async function EditPiecePage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const workshop = await getActiveWorkshop();
  if (!workshop) return <p>Aucun workshop actif.</p>;

  const [p, movements] = await Promise.all([
    prisma.piece.findFirst({
      where: { id, workshopId: workshop.id, deletedAt: null },
    }),
    prisma.stockMovement.findMany({
      where: { pieceId: id, workshopId: workshop.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
  ]);
  if (!p) notFound();

  return (
    <div>
      <PageHeader
        eyebrow="catalogue · modifier pièce"
        title={p.nomCanonical}
      />
      <div className="mx-auto max-w-[900px] p-6">
        <Link href={`/${locale}/admin/pieces`} className="mb-4 inline-block text-sm text-[var(--text-secondary-60)] hover:text-[var(--dark)]">← Toutes les pièces</Link>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>
        Stock physique : <strong>{p.stockPhysique}</strong> · Réservé sur BDT : <strong>{p.stockReserve}</strong> · Disponible : <strong>{p.stockPhysique - p.stockReserve}</strong>
      </p>

      <h2 style={h2}>Ajustement manuel</h2>
      <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.75rem' }}>
        Pour inventaire physique, perte, retour, etc. Crée un mouvement{' '}
        <code>MANUAL_ADJUSTMENT</code> dans l&apos;audit trail.
      </p>
      <AdjustStockForm pieceId={p.id} currentStock={p.stockPhysique} />

      <h2 style={{ ...h2, marginTop: '2rem' }}>Historique des mouvements ({movements.length})</h2>
      {movements.length === 0 ? (
        <p style={{ color: '#888' }}>Aucun mouvement enregistré.</p>
      ) : (
        <table style={tbl}>
          <thead>
            <tr style={{ background: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
              <th style={th}>Date</th>
              <th style={th}>Type</th>
              <th style={{ ...th, textAlign: 'right' }}>Delta</th>
              <th style={th}>Raison</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => {
              const color = TYPE_COLOR[m.type] ?? { bg: '#f5f5f5', fg: '#666' };
              const delta = Number(m.delta);
              return (
                <tr key={m.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ ...td, fontSize: '0.85rem', color: '#666' }}>
                    {m.createdAt.toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td style={td}>
                    <span style={{ background: color.bg, color: color.fg, padding: '0.15rem 0.45rem', borderRadius: 3, fontSize: '0.78rem', fontWeight: 500 }}>
                      {TYPE_LABEL[m.type] ?? m.type}
                    </span>
                  </td>
                  <td style={{ ...td, textAlign: 'right', fontFamily: 'monospace', color: delta < 0 ? '#c62828' : '#2e7d32' }}>
                    {delta > 0 ? '+' : ''}{delta}
                  </td>
                  <td style={{ ...td, fontSize: '0.85rem' }}>{m.reason ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <h2 style={{ ...h2, marginTop: '2rem' }}>Modifier la pièce</h2>
      <PieceForm initial={p} />
      </div>
    </div>
  );
}

const h2: React.CSSProperties = { fontSize: '1.15rem', marginBottom: '0.5rem' };
const tbl: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' };
const th: React.CSSProperties = { textAlign: 'left', padding: '0.5rem 0.6rem', fontWeight: 600, color: '#666', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' };
const td: React.CSSProperties = { padding: '0.5rem 0.6rem' };
