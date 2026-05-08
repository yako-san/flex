import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { AddItemForm } from './add-item-form';
import { RemoveItemButton } from './remove-item-button';
import { TaskStatusButton } from './task-status-button';
import { WorkflowForm } from './workflow-form';
import { DeleteBdtButton } from './delete-button';
import { PdfButtons } from './pdf-buttons';
import { EmailButtons } from './email-buttons';
import { PieceCmdEditor } from './piece-cmd-editor';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function BdcDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const workshop = await getActiveWorkshop();
  if (!workshop) return <p>Aucun workshop actif.</p>;

  const [bdc, services, pieces, forfaits, factureLog] = await Promise.all([
    prisma.bdc.findFirst({
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
    }),
    prisma.service.findMany({
      where: { workshopId: workshop.id, deletedAt: null },
      orderBy: { labelCanonical: 'asc' },
      select: { id: true, labelCanonical: true, prix: true, legacyCode: true },
    }),
    prisma.piece.findMany({
      where: { workshopId: workshop.id, deletedAt: null },
      orderBy: { nomCanonical: 'asc' },
      select: { id: true, nomCanonical: true, sku: true, prixVente: true },
    }),
    prisma.forfait.findMany({
      where: { workshopId: workshop.id, deletedAt: null },
      orderBy: { labelCanonical: 'asc' },
      select: { id: true, labelCanonical: true, prix: true, legacyCode: true },
    }),
    prisma.factureLog.findFirst({
      where: { bdcId: id, workshopId: workshop.id },
      orderBy: { date: 'desc' },
      select: { id: true, factureNumero: true },
    }),
  ]);

  if (!bdc) notFound();

  const v1 = bdc.legacyRawV1 as Record<string, unknown> | null;
  const totalServices = Number(bdc.totalServices);
  const totalPieces = Number(bdc.totalPieces);
  const grandTotal = totalServices + totalPieces;

  const serviceOptions = services.map((s) => ({
    id: s.id,
    label: `${s.legacyCode ?? '—'} · ${s.labelCanonical} · ${Number(s.prix).toFixed(2)}$`,
  }));
  const pieceOptions = pieces.map((p) => ({
    id: p.id,
    label: `${p.sku ?? '—'} · ${p.nomCanonical} · ${Number(p.prixVente).toFixed(2)}$`,
  }));
  const forfaitOptions = forfaits.map((f) => ({
    id: f.id,
    label: `${f.legacyCode ?? '—'} · ${f.labelCanonical} · ${Number(f.prix).toFixed(2)}$`,
  }));

  return (
    <div style={{ maxWidth: 1080 }}>
      <Link
        href={`/${locale}/admin/bdcs`}
        style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1rem' }}
      >
        ← Tous les BDT
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>
            BDT — Vélo{' '}
            <Link href={`/${locale}/admin/velos/${bdc.velo.id}`} style={linkStyle}>
              <span style={{ fontFamily: 'monospace' }}>
                {String(bdc.velo.veloNumero).padStart(4, '0')}
              </span>
            </Link>
          </h1>
          <p style={{ color: '#666', margin: 0 }}>
            {bdc.velo.client ? (
              <Link href={`/${locale}/admin/clients/${bdc.velo.client.id}`} style={linkStyle}>
                {bdc.velo.client.prenom} {bdc.velo.client.nom}
              </Link>
            ) : 'client inconnu'}
            {' · '}
            {[bdc.velo.marque?.nom, bdc.velo.modele, bdc.velo.couleur].filter(Boolean).join(', ')}
          </p>
        </div>
        <DeleteBdtButton bdcId={bdc.id} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Colonne gauche : items */}
        <div>
          <h2 style={h2Style}>Items ({bdc.items.length})</h2>

          <AddItemForm
            bdcId={bdc.id}
            services={serviceOptions}
            pieces={pieceOptions}
            forfaits={forfaitOptions}
          />

          {bdc.items.length === 0 ? (
            <p style={{ color: '#888' }}>Aucun item. Utilise le formulaire ci-dessus.</p>
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
                  <th style={thStyle}></th>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span>{item.labelSnapshot}</span>
                          {item.kind === 'PIECE' ? (
                            <PieceCmdEditor
                              itemId={item.id}
                              cmdStatus={item.cmdStatus}
                              cmdNote={item.cmdNote}
                            />
                          ) : null}
                        </div>
                        {item.piece?.sku ? (
                          <div style={{ color: '#888', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                            SKU {item.piece.sku}
                          </div>
                        ) : null}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>{Number(item.qty)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>{Number(item.unitPriceSnapshot).toFixed(2)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>{Number(item.total).toFixed(2)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <RemoveItemButton itemId={item.id} />
                      </td>
                    </tr>
                    {item.tasks.length > 0 ? (
                      <tr key={`${item.id}-tasks`}>
                        <td colSpan={7} style={{ background: '#fafafa', padding: '0.5rem 1rem 0.75rem 3rem' }}>
                          <div style={{ fontSize: '0.78rem', color: '#666', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Sous-tâches du forfait ({item.tasks.length}) — clique pour cycler le statut
                          </div>
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem' }}>
                            {item.tasks.map((t) => (
                              <li
                                key={t.id}
                                style={{ padding: '0.15rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                              >
                                <TaskStatusButton taskId={t.id} status={t.status} />
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
                  <td colSpan={3} style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                    {totalServices.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={4} style={{ ...tdStyle, textAlign: 'right', color: '#666' }}>Pièces</td>
                  <td colSpan={3} style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                    {totalPieces.toFixed(2)}
                  </td>
                </tr>
                <tr style={{ background: '#fafafa' }}>
                  <td colSpan={4} style={{ ...tdStyle, textAlign: 'right', color: '#1a1a1a', fontWeight: 700 }}>
                    Total HT
                  </td>
                  <td colSpan={3} style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem' }}>
                    {grandTotal.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}

          {v1 ? (
            <details style={{ marginTop: '2rem' }}>
              <summary style={{ cursor: 'pointer', color: '#666' }}>Données v1 brutes</summary>
              <pre style={preStyle}>{JSON.stringify(v1, null, 2)}</pre>
            </details>
          ) : null}
        </div>

        {/* Colonne droite : documents PDF + workflow */}
        <div>
          <h2 style={h2Style}>Documents</h2>
          <PdfButtons
            bdcId={bdc.id}
            existingFactureLogId={factureLog?.id ?? null}
            existingFactureNumero={factureLog?.factureNumero ?? null}
          />
          <EmailButtons
            bdcId={bdc.id}
            clientCourriel={bdc.velo.client?.courriel ?? null}
            evalEnvoyee={bdc.cbEvalEnvoye}
            suiviEnvoye={bdc.cbSuiviEnvoye}
            factureLogId={factureLog?.id ?? null}
            factureNumero={factureLog?.factureNumero ?? null}
          />
          <h2 style={{ ...h2Style, marginTop: '2rem' }}>Workflow</h2>
          <WorkflowForm bdc={bdc} key={bdc.updatedAt.toISOString()} />
        </div>
      </div>
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
