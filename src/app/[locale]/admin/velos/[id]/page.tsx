import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { DeleteVeloButton } from './delete-button';
import { bdcEvalStatusLabel, veloStatusLabel } from '@/lib/velo/status-labels';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function VeloDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const workshop = await getActiveWorkshop();
  if (!workshop) return <p>Aucun workshop actif.</p>;

  const velo = await prisma.velo.findFirst({
    where: { id, workshopId: workshop.id, deletedAt: null },
    include: {
      client: true,
      marque: { select: { nom: true } },
      evalMecano: { select: { surnom: true } },
      mecaMecano: { select: { surnom: true } },
      ctrlMecano: { select: { surnom: true } },
      bdcs: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { items: true } },
          factures: {
            select: {
              id: true,
              factureNumero: true,
              date: true,
              modePaiement: true,
              grandTotal: true,
            },
            orderBy: { date: 'desc' },
          },
        },
      },
    },
  });

  if (!velo) notFound();

  const v1 = velo.legacyRawV1 as Record<string, unknown> | null;
  const totalFactureVie = velo.bdcs.reduce(
    (acc, b) => acc + b.factures.reduce((a, f) => a + Number(f.grandTotal), 0),
    0,
  );
  const derniereIntervention =
    velo.bdcs[0]?.factures[0]?.date ?? velo.bdcs[0]?.createdAt ?? null;

  return (
    <div style={{ maxWidth: 960 }}>
      <Link
        href={`/${locale}/admin/velos`}
        style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1rem' }}
      >
        ← Tous les vélos
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>
            Vélo <span style={{ fontFamily: 'monospace' }}>{String(velo.veloNumero).padStart(4, '0')}</span>
          </h1>
          <p style={{ color: '#666', margin: 0 }}>
            {[velo.marque?.nom, velo.modele, velo.couleur, velo.taille].filter(Boolean).join(', ') || '—'}
          </p>
          <p style={{ color: '#666', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
            {velo.bdcs.length} BDT
            {totalFactureVie > 0 ? ` · ${totalFactureVie.toFixed(2)} $ facturé à vie` : ''}
            {derniereIntervention
              ? ` · dernière intervention ${derniereIntervention.toLocaleDateString('fr-CA')}`
              : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            href={`/${locale}/admin/velos/${velo.id}/edit`}
            style={{
              padding: '0.4rem 0.9rem',
              background: 'transparent',
              color: '#1565c0',
              border: '1px solid #1565c0',
              borderRadius: 4,
              textDecoration: 'none',
              fontSize: '0.9rem',
            }}
          >
            Modifier
          </Link>
          <DeleteVeloButton
            veloId={velo.id}
            veloLabel={`Vélo ${String(velo.veloNumero).padStart(4, '0')}`}
            hasBdcs={velo.bdcs.length > 0}
          />
        </div>
      </div>

      <h2 style={h2Style}>Caractéristiques</h2>
      <Row label="Client">
        {velo.client ? (
          <Link href={`/${locale}/admin/clients/${velo.client.id}`} style={linkStyle}>
            {velo.client.prenom} {velo.client.nom}
          </Link>
        ) : '—'}
      </Row>
      <Row label="Marque">{velo.marque?.nom ?? '—'}</Row>
      <Row label="Modèle">{velo.modele ?? '—'}</Row>
      <Row label="Couleur">{velo.couleur ?? '—'}</Row>
      <Row label="Taille">{velo.taille ?? '—'}</Row>
      <Row label="N° série">{velo.numeroSerie ?? '—'}</Row>
      <Row label="Status">{veloStatusLabel(velo.status)}</Row>

      <h2 style={{ ...h2Style, marginTop: '2rem' }}>Mécaniciens assignés</h2>
      <Row label="Évaluation">{velo.evalMecano?.surnom ?? '—'}</Row>
      <Row label="Mécanique">{velo.mecaMecano?.surnom ?? '—'}</Row>
      <Row label="Contrôle qualité">{velo.ctrlMecano?.surnom ?? '—'}</Row>

      <h2 style={{ ...h2Style, marginTop: '2rem' }}>Notes</h2>
      <Row label="Note vélo (interne)">{velo.noteVelo ?? '—'}</Row>
      <Row label="Note client (éval)">{velo.noteClientEval ?? '—'}</Row>
      <Row label="Note client (facture)">{velo.noteClientFacture ?? '—'}</Row>
      <Row label="Notes libres">{velo.notes ?? '—'}</Row>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', marginBottom: '0.75rem' }}>
        <h2 style={{ ...h2Style, marginBottom: 0 }}>Historique BDT ({velo.bdcs.length})</h2>
        <Link
          href={`/${locale}/admin/bdcs/new?veloId=${velo.id}`}
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
          + Nouveau BDT pour ce vélo
        </Link>
      </div>
      {velo.bdcs.length === 0 ? (
        <p style={{ color: '#888' }}>Aucun BDT pour ce vélo.</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>BDT</th>
              <th style={thStyle}>Statut éval</th>
              <th style={thStyle}>Archive</th>
              <th style={thStyle}>Facture</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Items</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Total facturé</th>
            </tr>
          </thead>
          <tbody>
            {velo.bdcs.map((b) => {
              const facture = b.factures[0] ?? null;
              return (
                <tr key={b.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ ...tdStyle, fontSize: '0.85rem', color: '#666' }}>
                    {b.createdAt.toLocaleDateString('fr-CA')}
                  </td>
                  <td style={tdStyle}>
                    <Link href={`/${locale}/admin/bdcs/${b.id}`} style={linkCellStyle}>
                      voir →
                    </Link>
                  </td>
                  <td style={tdStyle}>{bdcEvalStatusLabel(b.evalStatus)}</td>
                  <td style={{ ...tdStyle, fontSize: '0.85rem' }}>{b.archiveStatus}</td>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {facture ? (
                      <>
                        <a
                          href={`/api/admin/factures/${facture.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#2e7d32', textDecoration: 'none', fontWeight: 600 }}
                        >
                          {facture.factureNumero}
                        </a>
                        {facture.modePaiement ? (
                          <span style={{ color: '#888', marginLeft: 4 }}>
                            ({facture.modePaiement.toLowerCase()})
                          </span>
                        ) : null}
                      </>
                    ) : (
                      <span style={{ color: '#888' }}>—</span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{b._count.items}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace', fontWeight: facture ? 600 : 400 }}>
                    {facture ? `${Number(facture.grandTotal).toFixed(2)} $` : '—'}
                  </td>
                </tr>
              );
            })}
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
const linkStyle: React.CSSProperties = { color: '#1565c0', textDecoration: 'none' };
const linkCellStyle: React.CSSProperties = { color: '#1565c0', textDecoration: 'none' };
const preStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  background: '#fafafa',
  padding: '1rem',
  marginTop: '0.5rem',
  overflow: 'auto',
  borderRadius: 4,
};
