import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function ClientDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const workshop = await getActiveWorkshop();
  if (!workshop) return <p>Aucun workshop actif.</p>;

  const client = await prisma.client.findFirst({
    where: { id, workshopId: workshop.id, deletedAt: null },
    include: {
      velos: {
        where: { deletedAt: null },
        orderBy: { veloNumero: 'desc' },
        include: {
          marque: { select: { nom: true } },
          bdcs: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            select: { id: true, archiveStatus: true, totalServices: true, totalPieces: true },
          },
        },
      },
    },
  });

  if (!client) notFound();

  const v1 = client.legacyRawV1 as Record<string, unknown> | null;
  const totalBdcs = client.velos.reduce((acc, v) => acc + v.bdcs.length, 0);

  return (
    <div style={{ maxWidth: 960 }}>
      <Link
        href={`/${locale}/admin/clients`}
        style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1rem' }}
      >
        ← Tous les clients
      </Link>

      <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{client.prenom} {client.nom}</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        {client.velos.length} vélo{client.velos.length > 1 ? 's' : ''} · {totalBdcs} BDT
      </p>

      <h2 style={h2Style}>Coordonnées</h2>
      <Row label="Téléphone">{client.telephone ? `${client.indicatif ?? ''} ${client.telephone}` : '—'}</Row>
      <Row label="Courriel">{client.courriel ?? '—'}</Row>
      <Row label="Communication préférée">{client.commPref}</Row>
      <Row label="Lang">{client.lang}</Row>
      <Row label="Lead">{client.lead ?? '—'}</Row>
      <Row label="Remise par défaut">{client.remiseDefault ? `${Number(client.remiseDefault)}%` : '—'}</Row>
      <Row label="Notes">{client.notes ?? '—'}</Row>

      <h2 style={{ ...h2Style, marginTop: '2rem' }}>Vélos ({client.velos.length})</h2>
      {client.velos.length === 0 ? (
        <p style={{ color: '#888' }}>Aucun vélo enregistré.</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
              <th style={thStyle}>Vélo #</th>
              <th style={thStyle}>Marque/Modèle</th>
              <th style={thStyle}>Status</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>BDT</th>
            </tr>
          </thead>
          <tbody>
            {client.velos.map((v) => (
              <tr key={v.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={tdStyle}>
                  <Link href={`/${locale}/admin/velos/${v.id}`} style={linkCellStyle}>
                    {String(v.veloNumero).padStart(4, '0')}
                  </Link>
                </td>
                <td style={tdStyle}>{[v.marque?.nom, v.modele, v.couleur].filter(Boolean).join(', ') || '—'}</td>
                <td style={tdStyle}>{v.status}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{v.bdcs.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {v1 ? (
        <>
          <h2 style={{ ...h2Style, marginTop: '2rem' }}>Données v1 brutes</h2>
          <details>
            <summary style={{ cursor: 'pointer', color: '#666' }}>Afficher le JSON v1</summary>
            <pre style={preStyle}>{JSON.stringify(v1, null, 2)}</pre>
          </details>
        </>
      ) : null}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', padding: '0.35rem 0', fontSize: '0.95rem' }}>
      <span style={{ width: 220, color: '#666' }}>{label}</span>
      <span>{children}</span>
    </div>
  );
}

const h2Style: React.CSSProperties = { fontSize: '1.15rem', marginBottom: '0.75rem' };
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' };
const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.5rem 0.6rem',
  fontWeight: 600,
  color: '#666',
  fontSize: '0.78rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};
const tdStyle: React.CSSProperties = { padding: '0.5rem 0.6rem' };
const linkCellStyle: React.CSSProperties = { color: '#1565c0', textDecoration: 'none', fontFamily: 'monospace' };
const preStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  background: '#fafafa',
  padding: '1rem',
  marginTop: '0.5rem',
  overflow: 'auto',
  borderRadius: 4,
};
