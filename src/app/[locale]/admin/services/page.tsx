import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export default async function ServicesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const workshop = await getActiveWorkshop();
  if (!workshop) return <p>Aucun workshop actif.</p>;

  const services = await prisma.service.findMany({
    where: { workshopId: workshop.id, deletedAt: null },
    orderBy: [{ categorie: 'asc' }, { labelCanonical: 'asc' }],
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Services</h1>
          <p style={{ color: '#666', margin: 0 }}>{services.length} services au catalogue</p>
        </div>
        <Link href={`/${locale}/admin/services/new`} style={btnPrimary}>+ Nouveau service</Link>
      </div>
      <table style={tbl}>
        <thead>
          <tr style={{ background: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
            <th style={th}>Code</th>
            <th style={th}>Libellé</th>
            <th style={th}>Catégorie</th>
            <th style={{ ...th, textAlign: 'right' }}>Durée</th>
            <th style={{ ...th, textAlign: 'right' }}>Prix HT</th>
            <th style={th}>Taxable</th>
            <th style={{ ...th, textAlign: 'right' }}></th>
          </tr>
        </thead>
        <tbody>
          {services.map((s) => (
            <tr key={s.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ ...td, fontFamily: 'monospace', fontSize: '0.8rem', color: '#888' }}>{s.legacyCode ?? '—'}</td>
              <td style={td}>{s.labelCanonical}</td>
              <td style={{ ...td, fontSize: '0.85rem', color: '#666' }}>{s.categorie ?? '—'}</td>
              <td style={{ ...td, textAlign: 'right' }}>{s.dureeMinutes ? `${s.dureeMinutes} min` : '—'}</td>
              <td style={{ ...td, textAlign: 'right', fontFamily: 'monospace' }}>{Number(s.prix).toFixed(2)} $</td>
              <td style={td}>{s.taxable ? '✓' : '—'}</td>
              <td style={{ ...td, textAlign: 'right' }}>
                <Link href={`/${locale}/admin/services/${s.id}/edit`} style={linkBtn}>Modifier</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const btnPrimary: React.CSSProperties = { padding: '0.6rem 1.2rem', background: '#1a1a1a', color: 'white', textDecoration: 'none', borderRadius: 4, fontSize: '0.95rem' };
const linkBtn: React.CSSProperties = { color: '#1565c0', textDecoration: 'none', fontSize: '0.85rem' };
const tbl: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' };
const th: React.CSSProperties = { textAlign: 'left', padding: '0.5rem 0.6rem', fontWeight: 600, color: '#666', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' };
const td: React.CSSProperties = { padding: '0.5rem 0.6rem', verticalAlign: 'top' };
