import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { Prisma, type BdcEvalStatus, type VeloStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';
import { Pill } from '@/components/ui/pill';
import { ToolbarBlock, AddButton } from '@/components/ui/toolbar';
import { SearchBar } from '../_components/search-bar';
import { VELO_STATUS_LABELS, VELO_STATUS_COLORS } from '@/lib/velo/status-labels';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; archive?: string; refuse?: string }>;
};

type PillVariant = 'rv' | 'recu' | 'eval' | 'attente' | 'approuve' | 'on-bench' | 'ctrl-qlte' | 'fini' | 'facturer' | 'facture' | 'livre';

const STATUS_TO_PILL: Record<VeloStatus, PillVariant> = {
  RV: 'rv', RECU: 'recu', EVAL: 'eval', EN_ATTENTE: 'attente', APPROUVE: 'approuve',
  ON_BENCH: 'on-bench', CTRL_QLTE: 'ctrl-qlte', FINI: 'fini', FACTURER: 'facturer',
  FACTURE: 'facture', LIVRE: 'livre',
};

// Ordre V1 : RV → REÇU → EVAL → ON_BENCH → … → LIVRE. UNE seule table continue
// (pas de sections groupées avec headers comme V2 historique). La séparation
// visuelle vient des couleurs de fond par statut.
const STATUS_ORDER: Record<VeloStatus, number> = {
  RV: 0, RECU: 1, EVAL: 2, EN_ATTENTE: 3, APPROUVE: 4, ON_BENCH: 5,
  CTRL_QLTE: 6, FINI: 7, FACTURER: 8, FACTURE: 9, LIVRE: 10,
};

// État dérivé du workflow — texte affiché dans la colonne « État » V1.
// Quand un mécano est assigné à l'étape courante, on l'affiche ; sinon on
// affiche un message d'attente. V1 utilise massivement « Attente APPROBATION »
// pour les BDT en RV/RECU/EVAL (en attente retour client sur l'éval).
function getEtatText(
  status: VeloStatus,
  evalStatus: BdcEvalStatus,
  cbEvalEnvoye: boolean,
  ctrlMecano: string | null,
  mecaMecano: string | null,
): string {
  if (status === 'RV')         return 'Attente RV';
  if (status === 'RECU')       return 'Attente APPROBATION';
  if (status === 'EVAL')       return cbEvalEnvoye ? 'Attente APPROBATION' : 'En évaluation';
  if (status === 'EN_ATTENTE') return 'En attente client';
  if (status === 'APPROUVE')   return 'Attente MÉCANIQUE';
  if (status === 'ON_BENCH')   return ctrlMecano ?? mecaMecano ?? 'En cours';
  if (status === 'CTRL_QLTE')  return ctrlMecano ?? 'Contrôle qualité';
  if (status === 'FINI')       return 'Fini';
  if (status === 'FACTURER')   return 'À facturer';
  if (status === 'FACTURE')    return 'Facturé';
  if (status === 'LIVRE')      return 'Livré';
  return '';
  // eval_status n'est utilisé qu'à titre indicatif pour départager EVAL —
  // si plus tard on veut distinguer REDUX/ATTENTE/APPROUVE/INDECIS, il
  // suffit de brancher ici.
  // (paramètre conservé pour la future différenciation)
  void evalStatus;
}

export default async function BdcsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { q, archive, refuse } = await searchParams;
  setRequestLocale(locale);

  const workshop = await getActiveWorkshop();
  if (!workshop) return <p className="p-6 text-[var(--text-secondary-60)]">Aucun workshop actif.</p>;

  const trimmed = q?.trim() ?? '';
  const numeroAsInt = trimmed && /^\d+$/.test(trimmed) ? Number(trimmed) : undefined;

  // Filtres V1 — vue Archives (BDT plus dans le workflow actif) ou Refusés.
  // Par défaut on n'affiche QUE les BDT ACTIF (vue Inventaire principale).
  const archiveFilter: Prisma.BdcWhereInput =
    refuse === '1'
      ? { archiveStatus: 'ARCHIVE_REFUSE' }
      : archive === '1'
        ? { archiveStatus: { in: ['ARCHIVE_FACTURE', 'ARCHIVE_A_FACTURER', 'ARCHIVE_CTRL_QLTE'] } }
        : { archiveStatus: 'ACTIF' };

  const where: Prisma.BdcWhereInput = {
    workshopId: workshop.id,
    deletedAt: null,
    ...archiveFilter,
    ...(trimmed
      ? {
          OR: [
            { notes: { contains: trimmed, mode: Prisma.QueryMode.insensitive } },
            { velo: { modele: { contains: trimmed, mode: Prisma.QueryMode.insensitive } } },
            { velo: { numeroSerie: { contains: trimmed, mode: Prisma.QueryMode.insensitive } } },
            { velo: { client: { nom: { contains: trimmed, mode: Prisma.QueryMode.insensitive } } } },
            { velo: { client: { prenom: { contains: trimmed, mode: Prisma.QueryMode.insensitive } } } },
            { velo: { marque: { nom: { contains: trimmed, mode: Prisma.QueryMode.insensitive } } } },
            { factures: { some: { factureNumero: { contains: trimmed, mode: Prisma.QueryMode.insensitive } } } },
            ...(numeroAsInt !== undefined
              ? [{ numero: numeroAsInt }, { velo: { veloNumero: numeroAsInt } }]
              : []),
          ],
        }
      : {}),
  };

  const bdcs = await prisma.bdc.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      velo: {
        select: {
          veloNumero: true,
          modele: true,
          couleur: true,
          status: true,
          date2: true,
          client: { select: { id: true, prenom: true, nom: true } },
          marque: { select: { nom: true } },
          evalMecano: { select: { id: true, surnom: true } },
          mecaMecano: { select: { id: true, surnom: true } },
          ctrlMecano: { select: { id: true, surnom: true } },
        },
      },
    },
  });

  // Tri V1 : par priorité de statut (RV en haut, LIVRE en bas), puis par
  // date desc à l'intérieur de chaque tranche. UNE seule table continue.
  bdcs.sort((a, b) => {
    const ord = STATUS_ORDER[a.velo.status] - STATUS_ORDER[b.velo.status];
    if (ord !== 0) return ord;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const dateFmt = new Intl.DateTimeFormat('fr-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const totalShown = bdcs.length;

  return (
    <div>
      <PageHeader
        eyebrow={refuse === '1' ? 'archives' : archive === '1' ? 'archives' : 'vélos en atelier'}
        title={refuse === '1' ? 'BDT refusés' : archive === '1' ? 'BDT archivés' : 'Inventaire'}
        subline={`${totalShown} BDT${trimmed ? ` filtré sur « ${trimmed} »` : ''}`}
        actions={
          <ToolbarBlock>
            <SearchBar placeholder="N° vélo, client, modèle, marque, série, facture…" />
            <a
              href="/api/admin/export/bdcs"
              className="btn-secondary"
              style={{ height: '32px', padding: '0 14px', fontSize: '11px' }}
            >
              ↓ CSV
            </a>
            <AddButton href={`/${locale}/admin/bdcs/new`} title="Nouveau BDT" />
          </ToolbarBlock>
        }
      />

      <div className="px-6 py-4">
        {totalShown === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--gris-bord)] p-8 text-center text-sm text-[var(--text-secondary-60)]">
            Aucun BDT {trimmed ? `pour la recherche « ${trimmed} »` : ''}.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl shadow-sm">
            <table className="w-full border-separate border-spacing-y-0 text-sm">
              <thead className="bg-white/50 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
                <tr>
                  <th className="px-3 py-2 text-left">Statut</th>
                  <th className="px-3 py-2 text-left">BDT</th>
                  <th className="px-3 py-2 text-left">Vélo</th>
                  <th className="px-3 py-2 text-left">Client</th>
                  <th className="px-3 py-2 text-left">Éval</th>
                  <th className="px-3 py-2 text-left">Méca</th>
                  <th className="px-3 py-2 text-left">État</th>
                  <th className="px-3 py-2 text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {bdcs.map((b) => {
                  const colors = VELO_STATUS_COLORS[b.velo.status];
                  const pill = STATUS_TO_PILL[b.velo.status];
                  const label = VELO_STATUS_LABELS[b.velo.status].fr;
                  const eval_ = b.velo.evalMecano?.surnom;
                  const meca  = b.velo.mecaMecano?.surnom;
                  const placeholder = (
                    <span className="text-[var(--text-secondary-50)] italic">Sélection →</span>
                  );
                  const etat = getEtatText(
                    b.velo.status,
                    b.evalStatus,
                    b.cbEvalEnvoye,
                    b.velo.ctrlMecano?.surnom ?? null,
                    meca ?? null,
                  );
                  return (
                    <tr
                      key={b.id}
                      className="transition-opacity hover:opacity-90"
                      style={{ backgroundColor: colors.bg, color: colors.fg }}
                    >
                      <td className="px-3 py-2">
                        <Pill variant={pill} size="sm">{label}</Pill>
                      </td>
                      <td className="px-3 py-2 font-mono font-semibold">
                        <Link href={`/${locale}/admin/bdcs/${b.id}`} className="hover:underline">
                          {String(b.numero).padStart(4, '0')}
                        </Link>
                      </td>
                      <td className="px-3 py-2 max-w-[280px] truncate">
                        {[b.velo.marque?.nom, b.velo.modele, b.velo.couleur].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td className="px-3 py-2">
                        {b.velo.client ? (
                          <Link
                            href={`/${locale}/admin/clients/${b.velo.client.id ?? ''}`}
                            className="hover:underline"
                          >
                            {`${b.velo.client.prenom} ${b.velo.client.nom}`.trim()}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-3 py-2">{eval_ ?? placeholder}</td>
                      <td className="px-3 py-2">{meca ?? placeholder}</td>
                      <td className="px-3 py-2 text-xs italic opacity-80">{etat}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs tabular-nums opacity-80">
                        {b.velo.date2 ? dateFmt.format(b.velo.date2) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
