import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export default async function VentesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const workshop = await getActiveWorkshop();
  if (!workshop) return <p>Aucun workshop actif.</p>;

  const ventes = await prisma.venteDirecte.findMany({
    where: { workshopId: workshop.id, deletedAt: null },
    orderBy: [{ factureNumero: 'desc' }, { date: 'desc' }],
    include: {
      client: { select: { id: true, prenom: true, nom: true } },
      _count: { select: { items: true } },
    },
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Ventes directes (comptoir)</h1>
          <p style={{ color: '#666', margin: 0 }}>{ventes.length} ventes</p>
        </div>
        <Link
          href={`/${locale}/admin/ventes/new`}
          style={{
            padding: '0.6rem 1.2rem',
            background: '#1a1a1a',
            color: 'white',
            textDecoration: 'none',
            borderRadius: 4,
            fontSize: '0.95rem',
          }}
        >
          + Nouvelle vente
        </Link>
      </div>

      <table style={tbl}>
        <thead>
          <tr style={{ background: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
            <th style={th}>Date</th>
            <th style={th}>Facture</th>
            <th style={th}>Client</th>
            <th style={th}>Mode pmt</th>
            <th style={{ ...th, textAlign: 'right' }}>Items</th>
            <th style={{ ...th, textAlign: 'right' }}>Total HT</th>
            <th style={{ ...th, textAlign: 'right' }}></th>
          </tr>
        </thead>
        <tbody>
          {ventes.map((v) => (
            <tr key={v.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ ...td, fontSize: '0.85rem' }}>{v.date.toLocaleDateString('fr-CA')}</td>
              <td style={{ ...td, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                {v.factureNumero ? (
                  <span style={{ color: '#2e7d32', fontWeight: 600 }}>{v.factureNumero}</span>
                ) : (
                  <span style={{ color: '#888' }}>brouillon</span>
                )}
              </td>
              <td style={td}>
                {v.client ? `${v.client.prenom} ${v.client.nom}` : <span style={{ color: '#888' }}>walk-in</span>}
              </td>
              <td style={{ ...td, fontSize: '0.85rem' }}>{v.modePaiement ?? '—'}</td>
              <td style={{ ...td, textAlign: 'right' }}>{v._count.items}</td>
              <td style={{ ...td, textAlign: 'right', fontFamily: 'monospace' }}>
                {Number(v.totalPieces).toFixed(2)} $
              </td>
              <td style={{ ...td, textAlign: 'right' }}>
                <Link
                  href={`/${locale}/admin/ventes/${v.id}`}
                  style={{ color: '#1565c0', textDecoration: 'none', fontSize: '0.85rem' }}
                >
                  Détail →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const tbl: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' };
const th: React.CSSProperties = { textAlign: 'left', padding: '0.5rem 0.6rem', fontWeight: 600, color: '#666', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' };
const td: React.CSSProperties = { padding: '0.5rem 0.6rem' };
