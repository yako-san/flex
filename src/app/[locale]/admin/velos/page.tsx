import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { SearchBar } from '../_components/search-bar';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
};

export default async function VelosPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { q } = await searchParams;
  setRequestLocale(locale);

  const workshop = await getActiveWorkshop();
  if (!workshop) return <p>Aucun workshop actif.</p>;

  const trimmed = q?.trim() ?? '';
  const numeroAsInt = trimmed && /^\d+$/.test(trimmed) ? Number(trimmed) : undefined;

  const where: Prisma.VeloWhereInput = {
    workshopId: workshop.id,
    deletedAt: null,
    ...(trimmed
      ? {
          OR: [
            { modele: { contains: trimmed, mode: 'insensitive' } },
            { couleur: { contains: trimmed, mode: 'insensitive' } },
            { taille: { contains: trimmed, mode: 'insensitive' } },
            { numeroSerie: { contains: trimmed, mode: 'insensitive' } },
            { notes: { contains: trimmed, mode: 'insensitive' } },
            { client: { nom: { contains: trimmed, mode: 'insensitive' } } },
            { client: { prenom: { contains: trimmed, mode: 'insensitive' } } },
            { marque: { nom: { contains: trimmed, mode: 'insensitive' } } },
            ...(numeroAsInt !== undefined ? [{ veloNumero: numeroAsInt }] : []),
          ],
        }
      : {}),
  };

  const velos = await prisma.velo.findMany({
    where,
    orderBy: { veloNumero: 'desc' },
    include: {
      client: { select: { id: true, prenom: true, nom: true } },
      marque: { select: { nom: true } },
      _count: { select: { bdcs: true } },
    },
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Vélos</h1>
          <p style={{ color: '#666', margin: 0 }}>{velos.length} vélo{velos.length === 1 ? '' : 's'}{trimmed ? ` (filtré: « ${trimmed} »)` : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <SearchBar placeholder="N°, modèle, marque, client, série…" />
          <a href="/api/admin/export/velos" style={csvBtn}>↓ CSV</a>
          <Link
            href={`/${locale}/admin/velos/new`}
            style={{
              padding: '0.6rem 1.2rem',
              background: '#1a1a1a',
              color: 'white',
              textDecoration: 'none',
              borderRadius: 4,
              fontSize: '0.95rem',
            }}
          >
            + Nouveau vélo
          </Link>
        </div>
      </div>

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
                <Link
                  href={`/${locale}/admin/velos/${v.id}`}
                  style={{ color: '#1565c0', textDecoration: 'none' }}
                >
                  {String(v.veloNumero).padStart(4, '0')}
                </Link>
              </td>
              <td style={tdStyle}>
                {v.client ? (
                  <Link
                    href={`/${locale}/admin/clients/${v.client.id}`}
                    style={{ color: '#1565c0', textDecoration: 'none' }}
                  >
                    {`${v.client.prenom} ${v.client.nom}`.trim()}
                  </Link>
                ) : (
                  '—'
                )}
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

const csvBtn: React.CSSProperties = {
  padding: '0.55rem 0.9rem',
  border: '1px solid #ccc',
  color: '#444',
  textDecoration: 'none',
  borderRadius: 4,
  fontSize: '0.9rem',
  background: 'white',
};
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
