import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ClientsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const workshop = await prisma.workshop.findFirst({
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });
  if (!workshop) return <p>Aucun workshop.</p>;

  const clients = await prisma.client.findMany({
    where: { workshopId: workshop.id, deletedAt: null },
    orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
    include: { _count: { select: { velos: true } } },
  });

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Clients</h1>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>{clients.length} clients</p>

      <table style={tableStyle}>
        <thead>
          <tr style={{ background: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
            <th style={thStyle}>Nom</th>
            <th style={thStyle}>Téléphone</th>
            <th style={thStyle}>Courriel</th>
            <th style={thStyle}>Lang</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Vélos</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={tdStyle}>
                <strong>{c.prenom} {c.nom}</strong>
              </td>
              <td style={tdStyle}>{c.telephone ?? '—'}</td>
              <td style={{ ...tdStyle, fontSize: '0.85rem' }}>{c.courriel ?? '—'}</td>
              <td style={tdStyle}>{c.lang}</td>
              <td style={{ ...tdStyle, textAlign: 'right' }}>{c._count.velos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.95rem',
};
const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.6rem 0.75rem',
  fontWeight: 600,
  color: '#666',
  fontSize: '0.85rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};
const tdStyle: React.CSSProperties = {
  padding: '0.6rem 0.75rem',
};
