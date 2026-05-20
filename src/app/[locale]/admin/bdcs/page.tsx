import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { Prisma, type BdcEvalStatus, type VeloStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';
import { ToolbarBlock, AddButton } from '@/components/ui/toolbar';
import { SearchBar } from '../_components/search-bar';
import { VELO_STATUS_LABELS, VELO_STATUS_COLORS } from '@/lib/velo/status-labels';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; archive?: string; refuse?: string }>;
};

// Ordre V1 : RV → REÇU → EVAL → ON_BENCH → … → LIVRE.
const STATUS_ORDER: Record<VeloStatus, number> = {
  RV: 0, RECU: 1, EVAL: 2, EN_ATTENTE: 3, APPROUVE: 4, ON_BENCH: 5,
  CTRL_QLTE: 6, FINI: 7, FACTURER: 8, FACTURE: 9, LIVRE: 10,
};

// Regroupement V1 — 5 buckets séparés visuellement. « Staff » est une
// exception transversale : tout BDT dont le client est un membre actif
// de l'atelier (jointure `Client.courriel` ↔ `User.email` via
// `WorkshopMember`) tombe dans le bucket Staff peu importe son statut.
type GroupKey = 'nouveau' | 'en-cours' | 'termine' | 'livre' | 'staff';
const GROUP_OF_STATUS: Record<VeloStatus, Exclude<GroupKey, 'staff'>> = {
  RV: 'nouveau', RECU: 'nouveau', EVAL: 'nouveau',
  EN_ATTENTE: 'en-cours', APPROUVE: 'en-cours', ON_BENCH: 'en-cours',
  CTRL_QLTE: 'termine', FINI: 'termine', FACTURER: 'termine', FACTURE: 'termine',
  LIVRE: 'livre',
};
const GROUP_DEFS: Array<{ key: GroupKey; label: string }> = [
  { key: 'nouveau',  label: 'nouveau' },
  { key: 'en-cours', label: 'en cours' },
  { key: 'termine',  label: 'terminé' },
  { key: 'livre',    label: 'livré' },
  { key: 'staff',    label: 'staff' },
];

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
          client: { select: { id: true, prenom: true, nom: true, courriel: true } },
          marque: { select: { nom: true } },
          evalMecano: { select: { id: true, surnom: true } },
          mecaMecano: { select: { id: true, surnom: true } },
          ctrlMecano: { select: { id: true, surnom: true } },
        },
      },
    },
  });

  // Tri V1 : par priorité de statut (RV en haut, LIVRE en bas), puis par
  // date desc à l'intérieur de chaque tranche.
  bdcs.sort((a, b) => {
    const ord = STATUS_ORDER[a.velo.status] - STATUS_ORDER[b.velo.status];
    if (ord !== 0) return ord;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Emails des membres actifs de l'atelier — sert à détecter les BDT staff
  // sans flag dédié en DB. Match insensible à la casse via `@db.Citext`
  // côté Prisma + normalisation `.trim().toLowerCase()` côté JS.
  const members = await prisma.workshopMember.findMany({
    where: { workshopId: workshop.id, deletedAt: null },
    select: { user: { select: { email: true } } },
  });
  const staffEmails = new Set(
    members
      .map((m) => m.user.email?.trim().toLowerCase())
      .filter((e): e is string => Boolean(e)),
  );
  const isStaffBdc = (courriel: string | null | undefined): boolean =>
    Boolean(courriel && staffEmails.has(courriel.trim().toLowerCase()));

  // Bucketisation : staff override tout autre statut.
  const grouped: Record<GroupKey, typeof bdcs> = {
    nouveau: [], 'en-cours': [], termine: [], livre: [], staff: [],
  };
  for (const b of bdcs) {
    const key: GroupKey = isStaffBdc(b.velo.client?.courriel) ? 'staff' : GROUP_OF_STATUS[b.velo.status];
    grouped[key].push(b);
  }

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

      <div className="bloc-contenu px-6 py-4">
        {totalShown === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--gris-bord)] p-8 text-center text-sm text-[var(--text-secondary-60)]">
            Aucun BDT {trimmed ? `pour la recherche « ${trimmed} »` : ''}.
          </p>
        ) : (
          <div>
            {/* Header colonnes — aligné sur la grille des pills (lowercase 11pt). */}
            <div
              className="grid items-center px-[10px] py-[6px] text-[11px] font-semibold lowercase text-white/60"
              style={{
                gridTemplateColumns: '130px minmax(0,1.6fr) minmax(0,1.4fr) 90px 90px minmax(0,1.2fr) 110px',
                gap: 14,
              }}
            >
              <span>bdt</span>
              <span>vélo</span>
              <span>client</span>
              <span>éval</span>
              <span>méca</span>
              <span>état</span>
              <span className="text-center">date</span>
            </div>

            {/* Sections groupées V1 — gap visible entre buckets. Staff
                toujours en dernier (gris). Sections vides masquées. */}
            {GROUP_DEFS.map((g, gi) => {
              const rows = grouped[g.key];
              if (rows.length === 0) return null;
              const renderRow = (b: (typeof bdcs)[number]) => {
              const colors = VELO_STATUS_COLORS[b.velo.status];
              const label = VELO_STATUS_LABELS[b.velo.status].fr;
              const eval_ = b.velo.evalMecano?.surnom;
              const meca = b.velo.mecaMecano?.surnom;
              const isFacture = b.velo.status === 'FACTURE';
              // Pill statut inline avec ID. Spec preview : sur ligne colorée
              // standard, bg-black/15 text-black ; sur ligne FACTURÉ rose pâle,
              // bg bordeaux text-white.
              const pillBg = isFacture ? 'var(--st-facture-fg)' : 'rgba(0,0,0,0.15)';
              const pillFg = isFacture ? '#fff' : '#000';
              const placeholder = (
                <span className="italic opacity-60">Sélection →</span>
              );
              const etat = getEtatText(
                b.velo.status,
                b.evalStatus,
                b.cbEvalEnvoye,
                b.velo.ctrlMecano?.surnom ?? null,
                meca ?? null,
              );
              return (
                <div
                  key={b.id}
                  className="relative grid items-center rounded-full transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: colors.bg,
                    color: colors.fg,
                    gridTemplateColumns: '130px minmax(0,1.6fr) minmax(0,1.4fr) 90px 90px minmax(0,1.2fr) 110px',
                    padding: 10,
                    gap: 14,
                    marginBottom: 6,
                  }}
                >
                  {/* Overlay clickable — toute la ligne mène au BDT. Le lien
                      client interne reste accessible via z-index supérieur. */}
                  <Link
                    href={`/${locale}/admin/bdcs/${b.id}`}
                    aria-label={`BDT ${String(b.numero).padStart(4, '0')}`}
                    className="absolute inset-0 z-0 rounded-full focus:outline-none focus:ring-2 focus:ring-black/40"
                  />
                  {/* Col 1 — ID bold 17pt + pill statut 9pt inline. */}
                  <span
                    className="flex items-center gap-2 whitespace-nowrap font-bold leading-none"
                    style={{
                      fontSize: 17,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {String(b.numero).padStart(4, '0')}
                    <span
                      className="inline-flex items-center justify-center rounded-full uppercase"
                      style={{
                        background: pillBg,
                        color: pillFg,
                        padding: '3px 10px',
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        lineHeight: 1.2,
                      }}
                    >
                      {label}
                    </span>
                  </span>
                  <span
                    className="truncate text-left"
                    style={{ fontWeight: 500, fontSize: 13 }}
                  >
                    {[b.velo.marque?.nom, b.velo.modele, b.velo.couleur].filter(Boolean).join(', ') || '—'}
                  </span>
                  <span className="relative z-10 truncate text-left text-[13px]" style={{ fontWeight: 500 }}>
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
                  </span>
                  <span className="truncate text-xs">{eval_ ?? placeholder}</span>
                  <span className="truncate text-xs">{meca ?? placeholder}</span>
                  <span className="truncate text-xs italic opacity-70">{etat}</span>
                  <span
                    className="whitespace-nowrap text-center font-bold leading-none"
                    style={{
                      fontSize: 15,
                      fontVariantNumeric: 'tabular-nums',
                      opacity: 0.7,
                    }}
                  >
                    {b.velo.date2 ? dateFmt.format(b.velo.date2) : '—'}
                  </span>
                </div>
              );
              };
              return (
                <section key={g.key} className={gi === 0 ? '' : 'mt-3'}>
                  {/* H4 blanc — hérite des tokens --h4-* (uppercase via
                      --h4-caps, taille via --h4-size) éditables. */}
                  <h4 className="px-[10px] pb-1 pt-1 text-white">
                    {g.label} <span className="opacity-70">· {rows.length}</span>
                  </h4>
                  {rows.map(renderRow)}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
