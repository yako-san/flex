import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export default async function PiecesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const workshop = await getActiveWorkshop();
  if (!workshop) return <p>Aucun workshop actif.</p>;

  const pieces = await prisma.piece.findMany({
    where: { workshopId: workshop.id, deletedAt: null },
    orderBy: [{ categorie: 'asc' }, { nomCanonical: 'asc' }],
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Pièces (catalogue)</h1>
          <p style={{ color: '#666', margin: 0 }}>{pieces.length} pièces</p>
        </div>
        <Link href={`/${locale}/admin/pieces/new`} style={btnPrimary}>+ Nouvelle pièce</Link>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={tbl}>
          <thead>
            <tr style={{ background: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
              <th style={th}>Code</th>
              <th style={th}>SKU</th>
              <th style={th}>Nom</th>
              <th style={th}>Catégorie</th>
              <th style={th}>Fournisseur</th>
              <th style={{ ...th, textAlign: 'right' }}>Prix vente</th>
              <th style={{ ...th, textAlign: 'right' }}>Stock</th>
              <th style={{ ...th, textAlign: 'right' }}>Réservé</th>
              <th style={{ ...th, textAlign: 'right' }}></th>
            </tr>
          </thead>
          <tbody>
            {pieces.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ ...td, fontFamily: 'monospace', fontSize: '0.78rem', color: '#888' }}>{p.legacyCode ?? '—'}</td>
                <td style={{ ...td, fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.sku ?? '—'}</td>
                <td style={td}>{p.nomCanonical}</td>
                <td style={{ ...td, fontSize: '0.85rem', color: '#666' }}>{p.categorie ?? '—'}</td>
                <td style={td}>{p.fournisseur ?? '—'}</td>
                <td style={{ ...td, textAlign: 'right', fontFamily: 'monospace' }}>{Number(p.prixVente).toFixed(2)} $</td>
                <td style={{ ...td, textAlign: 'right' }}>{p.stockPhysique}</td>
                <td style={{ ...td, textAlign: 'right', color: '#888' }}>{p.stockReserve}</td>
                <td style={{ ...td, textAlign: 'right' }}>
                  <Link href={`/${locale}/admin/pieces/${p.id}/edit`} style={linkBtn}>Modifier</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = { padding: '0.6rem 1.2rem', background: '#1a1a1a', color: 'white', textDecoration: 'none', borderRadius: 4, fontSize: '0.95rem' };
const linkBtn: React.CSSProperties = { color: '#1565c0', textDecoration: 'none', fontSize: '0.85rem' };
const tbl: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' };
const th: React.CSSProperties = { textAlign: 'left', padding: '0.5rem 0.6rem', fontWeight: 600, color: '#666', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' };
const td: React.CSSProperties = { padding: '0.4rem 0.6rem', verticalAlign: 'top' };
