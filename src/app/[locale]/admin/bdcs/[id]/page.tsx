import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function BdcDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const workshop = await getActiveWorkshop();
  if (!workshop) return <p>Aucun workshop actif.</p>;

  const bdc = await prisma.bdc.findFirst({
    where: { id, workshopId: workshop.id, deletedAt: null },
    include: {
      velo: {
        include: {
          client: true,
          marque: { select: { nom: true } },
        },
      },
      items: {
        orderBy: { position: 'asc' },
        include: {
          service: { select: { labelCanonical: true, legacyCode: true } },
          piece: { select: { nomCanonical: true, sku: true, legacyCode: true } },
          forfait: { select: { labelCanonical: true, legacyCode: true } },
          tasks: { orderBy: { position: 'asc' } },
        },
      },
    },
  });

  if (!bdc) notFound();

  const v1 = bdc.legacyRawV1 as Record<string, unknown> | null;

  const totalServices = Number(bdc.totalServices);
  const totalPieces = Number(bdc.totalPieces);
  const grandTotal = totalServices + totalPieces;

  return (
    <div style={{ maxWidth: 960 }}>
      <Link
        href={`/${locale}/admin/bdcs`}
        style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1rem' }}
      >
        ← Tous les BDT
      </Link>

      <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>
        BDT — Vélo{' '}
        <Link href={`/${locale}/admin/velos/${bdc.velo.id}`} style={linkStyle}>
          <span style={{ fontFamily: 'monospace' }}>
            {String(bdc.velo.veloNumero).padStart(4, '0')}
          </span>
        </Link>
      </h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        {bdc.velo.client ? (
          <Link href={`/${locale}/admin/clients/${bdc.velo.client.id}`} style={linkStyle}>
            {bdc.velo.client.prenom} {bdc.velo.client.nom}
          </Link>
        ) : 'client inconnu'}
        {' · '}
        {[bdc.velo.marque?.nom, bdc.velo.modele, bdc.velo.couleur].filter(Boolean).join(', ')}
      </p>

      <h2 style={h2Style}>Workflow</h2>
      <Row label="Statut éval">{bdc.evalStatus}</Row>
      <Row label="Statut archive">{bdc.archiveStatus}</Row>
      <Row label="Évaluation envoyée">{bdc.cbEvalEnvoye ? '✓' : '—'}</Row>
      <Row label="Éval validée">{bdc.cbEval ? '✓' : '—'}</Row>
      <Row label="Bon de sortie">{bdc.cbBonSortie ? '✓' : '—'}</Row>
      <Row label="Archivé">{bdc.cbArchiver ? '✓' : '—'}</Row>

      <h2 style={{ ...h2Style, marginTop: '2rem' }}>Items ({bdc.items.length})</h2>
      {bdc.items.length === 0 ? (
        <p style={{ color: '#888' }}>Aucun item sur ce BDT.</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Description</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Qté</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>P.U.</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {bdc.items.map((item) => (
              <>
                <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={tdStyle}>{item.position}</td>
                  <td style={tdStyle}>
                    <KindBadge kind={item.kind} />
                  </td>
                  <td style={tdStyle}>
                    <div>{item.labelSnapshot}</div>
                    {item.piece?.sku ? (
                      <div style={{ color: '#888', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                        SKU {item.piece.sku}
                      </div>
                    ) : null}
                    {item.service?.legacyCode || item.forfait?.legacyCode || item.piece?.legacyCode ? (
                      <div style={{ color: '#888', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                        v1: {item.service?.legacyCode || item.forfait?.legacyCode || item.piece?.legacyCode}
                      </div>
                    ) : null}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>{Number(item.qty)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>{Number(item.unitPriceSnapshot).toFixed(2)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>{Number(item.total).toFixed(2)}</td>
                </tr>
                {item.tasks.length > 0 ? (
                  <tr key={`${item.id}-tasks`}>
                    <td colSpan={6} style={{ background: '#fafafa', padding: '0.5rem 1rem 0.75rem 3rem' }}>
                      <div style={{ fontSize: '0.78rem', color: '#666', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Sous-tâches du forfait ({item.tasks.length})
                      </div>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem' }}>
                        {item.tasks.map((t) => (
                          <li key={t.id} style={{ padding: '0.15rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <TaskStatusBadge status={t.status} />
                            <span>{t.labelSnapshot}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ) : null}
              </>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid #e0e0e0' }}>
              <td colSpan={4} style={{ ...tdStyle, textAlign: 'right', color: '#666' }}>Services</td>
              <td colSpan={2} style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                {totalServices.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={{ ...tdStyle, textAlign: 'right', color: '#666' }}>Pièces</td>
              <td colSpan={2} style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                {totalPieces.toFixed(2)}
              </td>
            </tr>
            <tr style={{ background: '#fafafa' }}>
              <td colSpan={4} style={{ ...tdStyle, textAlign: 'right', color: '#1a1a1a', fontWeight: 700 }}>
                Total HT
              </td>
              <td colSpan={2} style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem' }}>
                {grandTotal.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      )}

      {bdc.notes ? (
        <>
          <h2 style={{ ...h2Style, marginTop: '2rem' }}>Notes</h2>
          <pre style={{ ...preStyle, whiteSpace: 'pre-wrap' }}>{bdc.notes}</pre>
        </>
      ) : null}

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

function KindBadge({ kind }: { kind: string }) {
  const colors: Record<string, { bg: string; fg: string }> = {
    SERVICE: { bg: '#e3f2fd', fg: '#1565c0' },
    PIECE: { bg: '#fff3e0', fg: '#e65100' },
    FORFAIT: { bg: '#e8f5e9', fg: '#2e7d32' },
  };
  const c = colors[kind] ?? { bg: '#f5f5f5', fg: '#666' };
  return (
    <span style={{ background: c.bg, color: c.fg, padding: '0.1rem 0.4rem', borderRadius: 3, fontSize: '0.75rem', fontWeight: 500 }}>
      {kind}
    </span>
  );
}

function TaskStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    TODO: { bg: '#fff9c4', fg: '#f57f17', label: '○' },
    DONE: { bg: '#e8f5e9', fg: '#2e7d32', label: '✓' },
    SKIPPED: { bg: '#eeeeee', fg: '#666', label: '−' },
  };
  const c = map[status] ?? { bg: '#f5f5f5', fg: '#666', label: '?' };
  return (
    <span style={{
      background: c.bg, color: c.fg, padding: '0.05rem 0.4rem',
      borderRadius: 3, fontSize: '0.7rem', fontWeight: 600,
      minWidth: 20, display: 'inline-block', textAlign: 'center',
    }}>
      {c.label}
    </span>
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
const linkStyle: React.CSSProperties = { color: '#1565c0', textDecoration: 'none' };
const preStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  background: '#fafafa',
  padding: '1rem',
  marginTop: '0.5rem',
  overflow: 'auto',
  borderRadius: 4,
};
