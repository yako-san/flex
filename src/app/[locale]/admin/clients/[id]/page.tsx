import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';
import { DeleteClientButton } from './delete-button';
import { FactureStatutControls } from '../../factures/facture-statut-controls';

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

  // Historique facturation (BDT + ventes directes)
  const [factures, ventes] = await Promise.all([
    prisma.factureLog.findMany({
      where: { workshopId: workshop.id, clientId: client.id },
      orderBy: { date: 'desc' },
      select: {
        id: true,
        factureNumero: true,
        type: true,
        date: true,
        modePaiement: true,
        statut: true,
        grandTotal: true,
        bdcId: true,
        venteId: true,
      },
    }),
    prisma.venteDirecte.findMany({
      where: { workshopId: workshop.id, clientId: client.id, deletedAt: null, factureNumero: null },
      orderBy: { date: 'desc' },
      select: { id: true, date: true, totalPieces: true },
    }),
  ]);

  const v1 = client.legacyRawV1 as Record<string, unknown> | null;
  const totalBdcs = client.velos.reduce((acc, v) => acc + v.bdcs.length, 0);
  const totalDepenseVie = factures.reduce((acc, f) => acc + Number(f.grandTotal), 0);
  const dernierAchat = factures[0]?.date ?? null;

  return (
    <div>
      <PageHeader
        eyebrow="atelier · client"
        title={`${client.prenom} ${client.nom}`}
        subline={
          <span className="flex flex-wrap items-center gap-2">
            <span>{client.velos.length} vélo{client.velos.length > 1 ? 's' : ''}</span>
            <span className="opacity-60">·</span>
            <span>{totalBdcs} BDT</span>
            <span className="opacity-60">·</span>
            <span>{factures.length} facture{factures.length > 1 ? 's' : ''}</span>
            {totalDepenseVie > 0 ? (
              <>
                <span className="opacity-60">·</span>
                <span className="font-mono tabular-nums">{totalDepenseVie.toFixed(2)} $ à vie</span>
              </>
            ) : null}
            {dernierAchat ? (
              <>
                <span className="opacity-60">·</span>
                <span>dernier {dernierAchat.toLocaleDateString('fr-CA')}</span>
              </>
            ) : null}
          </span>
        }
        actions={
          <>
            <Link
              href={`/${locale}/admin/clients/${client.id}/edit`}
              className="rounded-full border border-[var(--gris-bord)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary-70)] hover:bg-[var(--gris-fond)]"
            >
              Modifier
            </Link>
            <DeleteClientButton
              clientId={client.id}
              clientName={`${client.prenom} ${client.nom}`}
              hasVelos={client.velos.length > 0}
            />
          </>
        }
      />

      <div className="mx-auto max-w-[960px] p-6">
        <Link
          href={`/${locale}/admin/clients`}
          className="mb-4 inline-block text-sm text-[var(--text-secondary-60)] hover:text-[var(--dark)]"
        >
          ← Tous les clients
        </Link>

      <h2 style={h2Style}>Coordonnées</h2>
      <Row label="Téléphone">{client.telephone ? `${client.indicatif ?? ''} ${client.telephone}` : '—'}</Row>
      <Row label="Courriel">{client.courriel ?? '—'}</Row>
      <Row label="Communication préférée">{client.commPref}</Row>
      <Row label="Lang">{client.lang}</Row>
      <Row label="Lead">{client.lead ?? '—'}</Row>
      <Row label="Remise par défaut">{client.remiseDefault ? `${Number(client.remiseDefault)}%` : '—'}</Row>
      <Row label="Notes">{client.notes ?? '—'}</Row>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', marginBottom: '0.75rem' }}>
        <h2 style={{ ...h2Style, marginBottom: 0 }}>Vélos ({client.velos.length})</h2>
        <Link
          href={`/${locale}/admin/velos/new?clientId=${client.id}`}
          style={{
            padding: '0.4rem 0.9rem',
            background: 'transparent',
            color: '#1565c0',
            border: '1px solid #1565c0',
            borderRadius: 4,
            textDecoration: 'none',
            fontSize: '0.85rem',
          }}
        >
          + Nouveau vélo pour ce client
        </Link>
      </div>
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

      <h2 style={{ ...h2Style, marginTop: '2rem' }}>Historique factures ({factures.length})</h2>
      {factures.length === 0 ? (
        <p style={{ color: '#888' }}>Aucune facture.</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>N°</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Statut</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {factures.map((f) => (
              <tr key={f.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ ...tdStyle, fontSize: '0.85rem' }}>{f.date.toLocaleDateString('fr-CA')}</td>
                <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.85rem' }}>{f.factureNumero}</td>
                <td style={{ ...tdStyle, fontSize: '0.85rem' }}>{f.type}</td>
                <td style={tdStyle}>
                  <FactureStatutControls
                    factureLogId={f.id}
                    statut={f.statut}
                    modePaiement={f.modePaiement}
                  />
                </td>
                <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                  {Number(f.grandTotal).toFixed(2)} $
                </td>
                <td style={{ ...tdStyle, fontSize: '0.85rem' }}>
                  <a href={`/api/admin/factures/${f.id}/pdf`} target="_blank" rel="noreferrer" style={linkCellStyle}>
                    PDF
                  </a>
                  {f.bdcId ? (
                    <>
                      {' · '}
                      <Link href={`/${locale}/admin/bdcs/${f.bdcId}`} style={linkCellStyle}>BDT</Link>
                    </>
                  ) : null}
                  {f.venteId ? (
                    <>
                      {' · '}
                      <Link href={`/${locale}/admin/ventes/${f.venteId}`} style={linkCellStyle}>Vente</Link>
                    </>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {ventes.length > 0 ? (
        <>
          <h2 style={{ ...h2Style, marginTop: '2rem' }}>Ventes brouillon ({ventes.length})</h2>
          <ul style={{ paddingLeft: '1.2rem' }}>
            {ventes.map((v) => (
              <li key={v.id} style={{ marginBottom: '0.25rem' }}>
                <Link href={`/${locale}/admin/ventes/${v.id}`} style={{ color: '#1565c0', textDecoration: 'none' }}>
                  {v.date.toLocaleDateString('fr-CA')} — {Number(v.totalPieces).toFixed(2)} $
                </Link>
              </li>
            ))}
          </ul>
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
