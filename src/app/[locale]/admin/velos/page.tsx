import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function VelosPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const workshop = await getActiveWorkshop();
  if (!workshop) return <p>Aucun workshop actif.</p>;

  const velos = await prisma.velo.findMany({
    where: { workshopId: workshop.id, deletedAt: null },
    orderBy: { veloNumero: 'desc' },
    include: {
      client: { select: { prenom: true, nom: true } },
      marque: { select: { nom: true } },
      _count: { select: { bdcs: true } },
    },
  });

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Vélos</h1>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>{velos.length} vélos</p>

      <table style={tableStyle}>
        <thead>
          <tr style={{ background: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
            <th style={thStyle}>#</th>
            <th style={thStyle}>Client</th>
            <th style={thStyle}>Marque</th>
            <th style={thStyle}>Modèle</th>
            <th style={thStyle}>Couleur</th>
            <th style={thStyle}>Taille</th>
            <th style={thStyle}>Status</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>BDCs</th>
          </tr>
        </thead>
        <tbody>
          {velos.map((v) => (
            <tr key={v.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ ...tdStyle, fontFamily: 'monospace' }}>
                {String(v.veloNumero).padStart(4, '0')}
              </td>
              <td style={tdStyle}>
                {v.client ? `${v.client.prenom} ${v.client.nom}`.trim() : '—'}
              </td>
              <td style={tdStyle}>{v.marque?.nom ?? '—'}</td>
              <td style={tdStyle}>{v.modele ?? '—'}</td>
              <td style={tdStyle}>{v.couleur ?? '—'}</td>
              <td style={tdStyle}>{v.taille ?? '—'}</td>
              <td style={tdStyle}>
                <StatusBadge status={v.status} />
              </td>
              <td style={{ ...tdStyle, textAlign: 'right' }}>{v._count.bdcs}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, { bg: string; fg: string }> = {
    RV: { bg: '#e3f2fd', fg: '#1565c0' },
    RECU: { bg: '#fff3e0', fg: '#e65100' },
    EN_ATTENTE: { bg: '#fff9c4', fg: '#f57f17' },
    EVAL: { bg: '#f3e5f5', fg: '#6a1b9a' },
    APPROUVE: { bg: '#e8f5e9', fg: '#2e7d32' },
    ON_BENCH: { bg: '#fff8e1', fg: '#ef6c00' },
    CTRL_QLTE: { bg: '#e0f7fa', fg: '#00838f' },
    FINI: { bg: '#e8f5e9', fg: '#1b5e20' },
    LIVRE: { bg: '#e8eaf6', fg: '#283593' },
    FACTURER: { bg: '#fce4ec', fg: '#ad1457' },
    FACTURE: { bg: '#eeeeee', fg: '#424242' },
  };
  const c = colorMap[status] ?? { bg: '#f5f5f5', fg: '#666' };
  return (
    <span
      style={{
        background: c.bg,
        color: c.fg,
        padding: '0.15rem 0.5rem',
        borderRadius: 4,
        fontSize: '0.8rem',
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
