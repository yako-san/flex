import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';

export const dynamic = 'force-dynamic';

const STATUS_COLOR: Record<string, { bg: string; fg: string; label: string }> = {
  EN_ATTENTE: { bg: '#fff9c4', fg: '#f57f17', label: 'En attente' },
  PARTIEL: { bg: '#fff8e1', fg: '#ef6c00', label: 'Partiel' },
  RECU: { bg: '#e8f5e9', fg: '#2e7d32', label: 'Reçu' },
  ANNULE: { bg: '#eeeeee', fg: '#666', label: 'Annulé' },
};

type Props = { params: Promise<{ locale: string }> };

export default async function PosPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const workshop = await getActiveWorkshop();
  if (!workshop) return <p>Aucun workshop actif.</p>;

  const pos = await prisma.po.findMany({
    where: { workshopId: workshop.id, deletedAt: null },
    orderBy: [{ status: 'asc' }, { dateCommande: 'desc' }],
    include: { _count: { select: { items: true } } },
  });

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Bons de commande fournisseurs (POs)</h1>
        <p style={{ color: '#666', margin: 0 }}>{pos.length} POs (création via import v1 pour l&apos;instant)</p>
      </div>
      <table style={tbl}>
        <thead>
          <tr style={{ background: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
            <th style={th}>N°</th>
            <th style={th}>Fournisseur</th>
            <th style={th}>Date commande</th>
            <th style={th}>Date réception</th>
            <th style={th}>Status</th>
            <th style={{ ...th, textAlign: 'right' }}>Items</th>
            <th style={{ ...th, textAlign: 'right' }}></th>
          </tr>
        </thead>
        <tbody>
          {pos.map((p) => {
            const sc = STATUS_COLOR[p.status] ?? { bg: '#f5f5f5', fg: '#666', label: p.status };
            return (
              <tr key={p.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ ...td, fontFamily: 'monospace', fontSize: '0.85rem' }}>{p.poNumero}</td>
                <td style={td}>{p.fournisseur}</td>
                <td style={{ ...td, fontSize: '0.85rem' }}>{p.dateCommande.toLocaleDateString('fr-CA')}</td>
                <td style={{ ...td, fontSize: '0.85rem' }}>{p.dateReception?.toLocaleDateString('fr-CA') ?? '—'}</td>
                <td style={td}>
                  <span style={{ background: sc.bg, color: sc.fg, padding: '0.15rem 0.5rem', borderRadius: 3, fontSize: '0.78rem', fontWeight: 500 }}>
                    {sc.label}
                  </span>
                </td>
                <td style={{ ...td, textAlign: 'right' }}>{p._count.items}</td>
                <td style={{ ...td, textAlign: 'right' }}>
                  <Link href={`/${locale}/admin/pos/${p.id}`} style={{ color: '#1565c0', textDecoration: 'none', fontSize: '0.85rem' }}>
                    Détail →
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const tbl: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' };
const th: React.CSSProperties = { textAlign: 'left', padding: '0.5rem 0.6rem', fontWeight: 600, color: '#666', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' };
const td: React.CSSProperties = { padding: '0.5rem 0.6rem' };
