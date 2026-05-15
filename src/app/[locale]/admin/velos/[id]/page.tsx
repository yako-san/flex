import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';
import { Pill } from '@/components/ui/pill';
import { DeleteVeloButton } from './delete-button';
import { bdcEvalStatusLabel, VELO_STATUS_LABELS } from '@/lib/velo/status-labels';
import type { VeloStatus } from '@prisma/client';

const STATUS_TO_PILL: Record<VeloStatus, 'rv' | 'recu' | 'eval' | 'attente' | 'approuve' | 'on-bench' | 'ctrl-qlte' | 'fini' | 'facturer' | 'facture' | 'livre'> = {
  RV: 'rv', RECU: 'recu', EVAL: 'eval', EN_ATTENTE: 'attente', APPROUVE: 'approuve',
  ON_BENCH: 'on-bench', CTRL_QLTE: 'ctrl-qlte', FINI: 'fini', FACTURER: 'facturer',
  FACTURE: 'facture', LIVRE: 'livre',
};

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
    <div>
      <PageHeader
        eyebrow="catalogue · vélo"
        title={
          <span>
            Vélo{' '}
            <span className="font-mono font-bold">
              {String(velo.veloNumero).padStart(4, '0')}
            </span>
          </span>
        }
        subline={
          <span className="flex flex-wrap items-center gap-2">
            <Pill variant={STATUS_TO_PILL[velo.status]} size="sm">
              {VELO_STATUS_LABELS[velo.status].fr}
            </Pill>
            <span>
              {[velo.marque?.nom, velo.modele, velo.couleur, velo.taille].filter(Boolean).join(', ') || '—'}
            </span>
            <span className="opacity-60">·</span>
            <span>{velo.bdcs.length} BDT</span>
            {totalFactureVie > 0 ? (
              <>
                <span className="opacity-60">·</span>
                <span>{totalFactureVie.toFixed(2)} $ facturé à vie</span>
              </>
            ) : null}
            {derniereIntervention ? (
              <>
                <span className="opacity-60">·</span>
                <span>dernière {derniereIntervention.toLocaleDateString('fr-CA')}</span>
              </>
            ) : null}
          </span>
        }
        actions={
          <>
            <Link
              href={`/${locale}/admin/velos/${velo.id}/edit`}
              className="rounded-full border border-[var(--gris-bord)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary-70)] hover:bg-[var(--gris-fond)]"
            >
              Modifier
            </Link>
            <DeleteVeloButton
              veloId={velo.id}
              veloLabel={`Vélo ${String(velo.veloNumero).padStart(4, '0')}`}
              hasBdcs={velo.bdcs.length > 0}
            />
          </>
        }
      />

      <div className="mx-auto max-w-[960px] p-6">
        <Link
          href={`/${locale}/admin/velos`}
          className="mb-4 inline-block text-sm text-[var(--text-secondary-60)] hover:text-[var(--dark)]"
        >
          ← Tous les vélos
        </Link>

        <h2 className="mb-3 mt-4 text-base font-semibold">Caractéristiques</h2>
        <Row label="Client">
          {velo.client ? (
            <Link href={`/${locale}/admin/clients/${velo.client.id}`} className="text-blue-600 hover:underline">
              {velo.client.prenom} {velo.client.nom}
            </Link>
          ) : '—'}
        </Row>
        <Row label="Marque">{velo.marque?.nom ?? '—'}</Row>
        <Row label="Modèle">{velo.modele ?? '—'}</Row>
        <Row label="Couleur">{velo.couleur ?? '—'}</Row>
        <Row label="Taille">{velo.taille ?? '—'}</Row>
        <Row label="N° série">{velo.numeroSerie ?? '—'}</Row>
        <Row label="Status">{VELO_STATUS_LABELS[velo.status].fr}</Row>

        <h2 className="mb-3 mt-8 text-base font-semibold">Mécaniciens assignés</h2>
        <Row label="Évaluation">{velo.evalMecano?.surnom ?? '—'}</Row>
        <Row label="Mécanique">{velo.mecaMecano?.surnom ?? '—'}</Row>
        <Row label="Contrôle qualité">{velo.ctrlMecano?.surnom ?? '—'}</Row>

        <h2 className="mb-3 mt-8 text-base font-semibold">Notes</h2>
        <Row label="Note vélo (interne)">{velo.noteVelo ?? '—'}</Row>
        <Row label="Notes libres">{velo.notes ?? '—'}</Row>
        <p className="mt-2 text-xs text-[var(--text-secondary-60)]">
          Les notes client (éval / facture) sont désormais éditées par-BDT
          directement (cf. fiche BDT).
        </p>

        <div className="mb-3 mt-8 flex items-center justify-between">
          <h2 className="text-base font-semibold">Historique BDT ({velo.bdcs.length})</h2>
          <Link
            href={`/${locale}/admin/bdcs/new?veloId=${velo.id}`}
            className="btn-secondary"
            style={{ height: '32px', padding: '0 14px', fontSize: '11px' }}
          >
            + Nouveau BDT pour ce vélo
          </Link>
        </div>
        {velo.bdcs.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary-60)]">Aucun BDT pour ce vélo.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-white/85 shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--gris-bord)] bg-white/50 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">BDT</th>
                  <th className="px-3 py-2 text-left">Statut éval</th>
                  <th className="px-3 py-2 text-left">Archive</th>
                  <th className="px-3 py-2 text-left">Facture</th>
                  <th className="px-3 py-2 text-right">Items</th>
                  <th className="px-3 py-2 text-right">Total facturé</th>
                </tr>
              </thead>
              <tbody>
                {velo.bdcs.map((b) => {
                  const facture = b.factures[0] ?? null;
                  return (
                    <tr key={b.id} className="border-t border-[var(--gris-bord)]/30 hover:bg-[var(--gris-fond)]">
                      <td className="px-3 py-2 text-xs text-[var(--text-secondary-60)]">
                        {b.createdAt.toLocaleDateString('fr-CA')}
                      </td>
                      <td className="px-3 py-2">
                        <Link href={`/${locale}/admin/bdcs/${b.id}`} className="text-blue-600 hover:underline">
                          voir →
                        </Link>
                      </td>
                      <td className="px-3 py-2">{bdcEvalStatusLabel(b.evalStatus)}</td>
                      <td className="px-3 py-2 text-xs">{b.archiveStatus}</td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {facture ? (
                          <>
                            <a
                              href={`/api/admin/factures/${facture.id}/pdf`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-green-700 hover:underline"
                            >
                              {facture.factureNumero}
                            </a>
                            {facture.modePaiement ? (
                              <span className="ml-1 text-[var(--text-secondary-60)]">
                                ({facture.modePaiement.toLowerCase()})
                              </span>
                            ) : null}
                          </>
                        ) : (
                          <span className="text-[var(--text-secondary-60)]">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{b._count.items}</td>
                      <td className={`px-3 py-2 text-right font-mono tabular-nums${facture ? ' font-semibold' : ''}`}>
                        {facture ? `${Number(facture.grandTotal).toFixed(2)} $` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

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
