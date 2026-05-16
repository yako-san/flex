import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { VeloStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';
import { Pill } from '@/components/ui/pill';
import { VELO_STATUS_LABELS } from '@/lib/velo/status-labels';
import { DeleteClientButton } from './delete-button';
import { FactureStatutControls } from '../../factures/facture-statut-controls';

type PillVariant = 'rv' | 'recu' | 'eval' | 'attente' | 'approuve' | 'on-bench' | 'ctrl-qlte' | 'fini' | 'facturer' | 'facture' | 'livre';

const STATUS_TO_PILL: Record<VeloStatus, PillVariant> = {
  RV: 'rv', RECU: 'recu', EVAL: 'eval', EN_ATTENTE: 'attente', APPROUVE: 'approuve',
  ON_BENCH: 'on-bench', CTRL_QLTE: 'ctrl-qlte', FINI: 'fini', FACTURER: 'facturer',
  FACTURE: 'facture', LIVRE: 'livre',
};

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

        <h2 className="mb-3 mt-4 text-base font-semibold">Coordonnées</h2>
        <Row label="Téléphone">{client.telephone ? `${client.indicatif ?? ''} ${client.telephone}` : '—'}</Row>
        <Row label="Courriel">{client.courriel ?? '—'}</Row>
        <Row label="Communication préférée">{client.commPref}</Row>
        <Row label="Lang">{client.lang}</Row>
        <Row label="Lead">{client.lead ?? '—'}</Row>
        <Row label="Remise par défaut">{client.remiseDefault ? `${Number(client.remiseDefault)}%` : '—'}</Row>
        <Row label="Notes">{client.notes ?? '—'}</Row>

        <div className="mb-3 mt-8 flex items-center justify-between">
          <h2 className="text-base font-semibold">Vélos ({client.velos.length})</h2>
          <Link
            href={`/${locale}/admin/velos/new?clientId=${client.id}`}
            className="btn-secondary"
            style={{ height: '32px', padding: '0 14px', fontSize: '11px' }}
          >
            + Nouveau vélo pour ce client
          </Link>
        </div>
        {client.velos.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary-60)]">Aucun vélo enregistré.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-white/85 shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--gris-bord)] bg-white/50 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
                <tr>
                  <th className="px-3 py-2 text-left">Vélo #</th>
                  <th className="px-3 py-2 text-left">Marque/Modèle</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-right">BDT</th>
                </tr>
              </thead>
              <tbody>
                {client.velos.map((v) => (
                  <tr key={v.id} className="odd:bg-white/85 even:bg-white/70 border-t border-[var(--gris-bord)]/30 hover:bg-[var(--gris-fond)]">
                    <td className="px-3 py-2">
                      <Link href={`/${locale}/admin/velos/${v.id}`} className="font-mono text-[var(--jaune-h)] hover:underline">
                        {String(v.veloNumero).padStart(4, '0')}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{[v.marque?.nom, v.modele, v.couleur].filter(Boolean).join(', ') || '—'}</td>
                    <td className="px-3 py-2">
                      <Pill variant={STATUS_TO_PILL[v.status]} size="sm">
                        {VELO_STATUS_LABELS[v.status].fr}
                      </Pill>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{v.bdcs.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h2 className="mb-3 mt-8 text-base font-semibold">Historique factures ({factures.length})</h2>
        {factures.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary-60)]">Aucune facture.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-white/85 shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--gris-bord)] bg-white/50 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">N°</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Statut</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2 text-left"></th>
                </tr>
              </thead>
              <tbody>
                {factures.map((f) => (
                  <tr key={f.id} className="odd:bg-white/85 even:bg-white/70 border-t border-[var(--gris-bord)]/30 hover:bg-[var(--gris-fond)]">
                    <td className="px-3 py-2 text-xs">{f.date.toLocaleDateString('fr-CA')}</td>
                    <td className="px-3 py-2 font-mono text-xs">{f.factureNumero}</td>
                    <td className="px-3 py-2 text-xs">{f.type}</td>
                    <td className="px-3 py-2">
                      <FactureStatutControls
                        factureLogId={f.id}
                        statut={f.statut}
                        modePaiement={f.modePaiement}
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-semibold tabular-nums">
                      {Number(f.grandTotal).toFixed(2)} $
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <a href={`/api/admin/factures/${f.id}/pdf`} target="_blank" rel="noreferrer" className="font-mono text-[var(--jaune-h)] hover:underline">
                        PDF
                      </a>
                      {f.bdcId ? (
                        <>
                          {' · '}
                          <Link href={`/${locale}/admin/bdcs/${f.bdcId}`} className="font-mono text-[var(--jaune-h)] hover:underline">BDT</Link>
                        </>
                      ) : null}
                      {f.venteId ? (
                        <>
                          {' · '}
                          <Link href={`/${locale}/admin/ventes/${f.venteId}`} className="font-mono text-[var(--jaune-h)] hover:underline">Vente</Link>
                        </>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {ventes.length > 0 ? (
          <>
            <h2 className="mb-3 mt-8 text-base font-semibold">Ventes brouillon ({ventes.length})</h2>
            <ul className="list-disc pl-5">
              {ventes.map((v) => (
                <li key={v.id} className="mb-1">
                  <Link href={`/${locale}/admin/ventes/${v.id}`} className="text-[var(--jaune-h)] hover:underline">
                    {v.date.toLocaleDateString('fr-CA')} — {Number(v.totalPieces).toFixed(2)} $
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {v1 ? (
          <>
            <h2 className="mb-3 mt-8 text-base font-semibold">Données v1 brutes</h2>
            <details>
              <summary className="cursor-pointer text-[var(--text-secondary-60)]">Afficher le JSON v1</summary>
              <pre className="mt-2 overflow-auto rounded-xl bg-white/60 p-4 text-xs">
                {JSON.stringify(v1, null, 2)}
              </pre>
            </details>
          </>
        ) : null}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 py-1.5 text-sm">
      <span className="w-[220px] shrink-0 text-[var(--text-secondary-60)]">{label}</span>
      <span>{children}</span>
    </div>
  );
}
