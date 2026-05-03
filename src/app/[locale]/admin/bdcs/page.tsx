import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function BdcsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const workshop = await prisma.workshop.findFirst({
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });
  if (!workshop) return <p>Aucun workshop.</p>;

  const bdcs = await prisma.bdc.findMany({
    where: { workshopId: workshop.id, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: {
      velo: {
        select: {
          veloNumero: true,
          modele: true,
          couleur: true,
          client: { select: { prenom: true, nom: true } },
          marque: { select: { nom: true } },
        },
      },
      _count: { select: { items: true } },
    },
  });

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Bons de commande</h1>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>{bdcs.length} BDCs</p>

      <table style={tableStyle}>
        <thead>
          <tr style={{ background: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
            <th style={thStyle}>Vélo #</th>
            <th style={thStyle}>Client</th>
            <th style={thStyle}>Vélo</th>
            <th style={thStyle}>Statut éval</th>
            <th style={thStyle}>Archive</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Items</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Services</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Pièces</th>
          </tr>
        </thead>
        <tbody>
          {bdcs.map((b) => (
            <tr key={b.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ ...tdStyle, fontFamily: 'monospace' }}>
                {String(b.velo.veloNumero).padStart(4, '0')}
              </td>
              <td style={tdStyle}>
                {b.velo.client
                  ? `${b.velo.client.prenom} ${b.velo.client.nom}`.trim()
                  : '—'}
              </td>
              <td style={tdStyle}>
                {[b.velo.marque?.nom, b.velo.modele, b.velo.couleur].filter(Boolean).join(', ') ||
                  '—'}
              </td>
              <td style={tdStyle}>{b.evalStatus}</td>
              <td style={tdStyle}>
                <ArchiveBadge status={b.archiveStatus} />
              </td>
              <td style={{ ...tdStyle, textAlign: 'right' }}>{b._count.items}</td>
              <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>
                {Number(b.totalServices).toFixed(2)}
              </td>
              <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>
                {Number(b.totalPieces).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ArchiveBadge({ status }: { status: string }) {
  const colorMap: Record<string, { bg: string; fg: string }> = {
    ACTIF: { bg: '#e3f2fd', fg: '#1565c0' },
    ARCHIVE_FACTURE: { bg: '#e8f5e9', fg: '#1b5e20' },
    ARCHIVE_A_FACTURER: { bg: '#fff9c4', fg: '#f57f17' },
    ARCHIVE_REFUSE: { bg: '#ffebee', fg: '#c62828' },
    ARCHIVE_CTRL_QLTE: { bg: '#e0f7fa', fg: '#00838f' },
    ARCHIVE_EVAL: { bg: '#f3e5f5', fg: '#6a1b9a' },
    ARCHIVE_LEGACY: { bg: '#eeeeee', fg: '#666' },
  };
  const c = colorMap[status] ?? { bg: '#f5f5f5', fg: '#666' };
  return (
    <span
      style={{
        background: c.bg,
        color: c.fg,
        padding: '0.15rem 0.5rem',
        borderRadius: 4,
        fontSize: '0.75rem',
        fontWeight: 500,
      }}
    >
      {status}
    </span>
  );
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.9rem',
};
const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.5rem 0.6rem',
  fontWeight: 600,
  color: '#666',
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};
const tdStyle: React.CSSProperties = {
  padding: '0.5rem 0.6rem',
};
