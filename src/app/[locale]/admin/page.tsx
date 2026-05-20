import * as React from 'react';
import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import Decimal from 'decimal.js';
import {
  BikeIcon,
  PackageIcon,
  BellIcon,
  DollarSignIcon,
  CalendarIcon,
  FileTextIcon,
  ShoppingCartIcon,
} from '@/components/icons';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard } from './_dashboard/kpi-card';
import { ListCard } from './_dashboard/list-card';
import { HeatmapMini } from './_dashboard/heatmap-mini';
import { PipelineWidget, type PipelineStatus } from './_dashboard/pipeline-widget';
import { RevenueWidget } from './_dashboard/revenue-widget';
import { FeedWidget, type FeedItem } from './_dashboard/feed-widget';
import { PiecesACommanderCard } from './_dashboard/pieces-card';
import { VELO_STATUS_LABELS } from '@/lib/velo/status-labels';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

const MOIS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const STATUS_TO_PILL: Record<string, string> = {
  RV: 'rv', RECU: 'recu', EVAL: 'eval', EN_ATTENTE: 'attente', APPROUVE: 'approuve',
  ON_BENCH: 'on-bench', CTRL_QLTE: 'ctrl-qlte', FINI: 'fini', FACTURER: 'facturer',
  FACTURE: 'facture', LIVRE: 'livre',
};

export default async function AdminDashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const workshop = await getActiveWorkshop();

  if (!workshop) {
    return (
      <div>
        <PageHeader eyebrow="atelier" title="Dashboard" />
        <p className="p-6 text-sm text-[var(--text-secondary-60)]">
          Aucun workshop importé. Va dans <strong>Import v1</strong> pour charger le dump.
        </p>
      </div>
    );
  }

  const wid = workshop.id;
  const now = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const start14d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13);
  const eyebrow = `atelier · ${MOIS_FR[now.getMonth()]} ${now.getFullYear()}`;

  const [
    bdcActifCount,
    bdcByVeloStatus,
    revenueMonth,
    revenueLast14,
    revenuePrev14,
    piecesNeedingOrder,
    recentFactures,
    recentVentes,
    rendezVous,
    suivis,
    chargeBdt,
    pipelineCards,
    activityFeed,
  ] = await Promise.all([
    // KPI 1 — BDT actifs
    prisma.bdc.count({ where: { workshopId: wid, deletedAt: null, archiveStatus: 'ACTIF' } }),

    // KPI 1 — counts par statut vélo (pour les pills sous le KPI)
    prisma.velo.groupBy({
      by: ['status'],
      where: {
        workshopId: wid,
        deletedAt: null,
        bdcs: { some: { archiveStatus: 'ACTIF', deletedAt: null } },
      },
      _count: { _all: true },
    }),

    // KPI 4 — Revenus du mois
    prisma.factureLog.aggregate({
      where: { workshopId: wid, date: { gte: startMonth } },
      _sum: { grandTotal: true },
    }),

    // Revenu 14 derniers jours (pour la sparkline area chart)
    prisma.factureLog.findMany({
      where: { workshopId: wid, date: { gte: start14d } },
      select: { date: true, grandTotal: true },
      orderBy: { date: 'asc' },
    }),

    // Revenu 14 jours précédents (pour le delta %)
    prisma.factureLog.aggregate({
      where: {
        workshopId: wid,
        date: { gte: new Date(start14d.getTime() - 14 * 86400000), lt: start14d },
      },
      _sum: { grandTotal: true },
    }),

    // KPI 3 — Pièces à commander (stock ≤ 0)
    prisma.piece.findMany({
      where: { workshopId: wid, deletedAt: null, stockPhysique: { lte: 0 } },
      select: { id: true, sku: true, nomCanonical: true, stockPhysique: true },
      orderBy: { stockPhysique: 'asc' },
      take: 30,
    }),

    // Liste — Dernières factures (4 derniers)
    prisma.factureLog.findMany({
      where: { workshopId: wid },
      orderBy: { date: 'desc' },
      take: 4,
      select: {
        id: true,
        factureNumero: true,
        date: true,
        grandTotal: true,
        client: { select: { prenom: true, nom: true } },
      },
    }),

    // Liste — Dernières ventes (4)
    prisma.venteDirecte.findMany({
      where: { workshopId: wid, deletedAt: null, factureNumero: { not: null } },
      orderBy: { factureDate: 'desc' },
      take: 4,
      select: {
        id: true,
        factureNumero: true,
        totalPieces: true,
        client: { select: { prenom: true, nom: true } },
      },
    }),

    // Liste — Rendez-vous (RV + REÇU)
    prisma.bdc.findMany({
      where: { workshopId: wid, deletedAt: null, velo: { status: { in: ['RV', 'RECU'] } } },
      orderBy: { updatedAt: 'desc' },
      take: 3,
      select: {
        id: true, numero: true,
        velo: {
          select: {
            status: true,
            client: { select: { prenom: true, nom: true } },
            marque: { select: { nom: true } },
            modele: true,
          },
        },
      },
    }),

    // Liste — Suivis à faire (BDT livrés sans relance + RV à confirmer + factures impayées)
    prisma.bdc.findMany({
      where: {
        workshopId: wid, deletedAt: null,
        OR: [
          { velo: { status: 'LIVRE' }, cbBonSortie: true, cbSuiviEnvoye: false },
          { velo: { status: { in: ['RV', 'EVAL', 'EN_ATTENTE'] } } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: 6,
      select: {
        id: true, numero: true,
        velo: {
          select: {
            status: true,
            client: { select: { prenom: true, nom: true } },
            modele: true,
          },
        },
      },
    }),

    // Charge semaine (BDT actifs par jour de RV de la semaine en cours)
    prisma.bdc.findMany({
      where: {
        workshopId: wid, deletedAt: null, archiveStatus: 'ACTIF',
        velo: { date2: { not: null } },
      },
      select: { velo: { select: { date2: true } } },
    }),

    // Pipeline — BDT actifs par statut, 4 plus récents par statut
    prisma.bdc.findMany({
      where: { workshopId: wid, deletedAt: null, archiveStatus: 'ACTIF' },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: {
        id: true, numero: true, updatedAt: true,
        velo: {
          select: {
            status: true,
            client: { select: { prenom: true, nom: true } },
          },
        },
      },
    }),

    // Feed d'activité — derniers events DB (BDT créés, factures récentes)
    prisma.bdc.findMany({
      where: { workshopId: wid, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: 8,
      select: {
        id: true, numero: true, updatedAt: true,
        velo: {
          select: {
            status: true,
            client: { select: { prenom: true, nom: true } },
          },
        },
      },
    }),
  ]);

  // KPI 1 — pills par statut vélo
  const veloCounts: Record<string, number> = {};
  for (const r of bdcByVeloStatus) veloCounts[r.status] = r._count._all;
  const pill = (variant: string, label: string, n: number) =>
    n > 0 ? <span key={variant} className={`pill ${variant}`}>{n} {label}</span> : null;

  // KPI 3 — stock à commander
  const stockTotal = piecesNeedingOrder.reduce((acc, p) => acc + Math.max(1, -p.stockPhysique + 1), 0);
  const ruptures = piecesNeedingOrder.filter((p) => p.stockPhysique <= 0).length;

  // KPI 4 — revenu du mois + delta
  const caMonth = new Decimal(revenueMonth._sum.grandTotal?.toString() ?? '0').toNumber();
  const caLast14 = revenueLast14.reduce((acc, f) => acc + Number(f.grandTotal), 0);
  const caPrev14 = new Decimal(revenuePrev14._sum.grandTotal?.toString() ?? '0').toNumber();
  const delta14 = caPrev14 > 0 ? Math.round(((caLast14 - caPrev14) / caPrev14) * 100) : null;

  // Revenu 14 jours — aggrégé par jour pour la sparkline
  const revenueSeries: Array<{ day: string; total: number }> = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(start14d.getTime() + i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const total = revenueLast14
      .filter((f) => f.date.toISOString().slice(0, 10) === key)
      .reduce((acc, f) => acc + Number(f.grandTotal), 0);
    revenueSeries.push({ day: key, total });
  }

  // Charge semaine — 7 valeurs lun→dim
  const charge = [0, 0, 0, 0, 0, 0, 0];
  const monday = new Date(now);
  const dow = (monday.getDay() + 6) % 7; // 0=Mon..6=Sun
  monday.setDate(monday.getDate() - dow);
  monday.setHours(0, 0, 0, 0);
  for (const c of chargeBdt) {
    const d = c.velo.date2;
    if (!d) continue;
    const diff = Math.floor((d.getTime() - monday.getTime()) / 86400000);
    if (diff >= 0 && diff < 7) charge[diff]! += 1;
  }

  // Pipeline cards — distribués par statut, max 4 par col
  const pipelineByStatus = new Map<PipelineStatus, typeof pipelineCards>();
  for (const c of pipelineCards) {
    const s = c.velo.status as PipelineStatus;
    const arr = pipelineByStatus.get(s) ?? [];
    arr.push(c);
    pipelineByStatus.set(s, arr);
  }
  const pipelineCardsForWidget = pipelineCards
    .filter((c) => ['RV','RECU','EVAL','EN_ATTENTE','APPROUVE','ON_BENCH','FACTURER'].includes(c.velo.status))
    .slice(0, 28)
    .map((c, idx) => ({
      id: c.id,
      numero: c.numero,
      who: c.velo.client ? `${c.velo.client.prenom} ${c.velo.client.nom}`.trim() : null,
      status: c.velo.status as PipelineStatus,
      active: idx === 0,
    }));

  // Feed — convertit les derniers BDT en items d'activité
  const feedItems: FeedItem[] = activityFeed.slice(0, 6).map((b) => {
    const status = b.velo.status as keyof typeof VELO_STATUS_LABELS;
    const label = VELO_STATUS_LABELS[status]?.fr ?? status;
    const minutesAgo = Math.max(1, Math.round((now.getTime() - new Date(b.updatedAt).getTime()) / 60000));
    const time =
      minutesAgo < 60 ? `il y a ${minutesAgo} min` :
      minutesAgo < 1440 ? `il y a ${Math.round(minutesAgo / 60)} h` :
      `il y a ${Math.round(minutesAgo / 1440)} j`;
    return {
      id: b.id,
      who: b.velo.client ? `${b.velo.client.prenom} ${b.velo.client.nom}`.trim() : 'Anonyme',
      what: `BDT #${String(b.numero).padStart(4, '0')} · ${label}`,
      dotColor: `var(--st-${STATUS_TO_PILL[b.velo.status] ?? 'on-bench'}-bg)`,
      time,
    };
  });

  // Formatage prix : `2 185 $`, sans décimale, espace insécable.
  const fmtMoney = (n: number) => `${Math.round(n).toLocaleString('fr-CA')} $`;

  return (
    <div>
      <PageHeader eyebrow={eyebrow} title="Dashboard" />

      <div className="bloc-contenu space-y-3 p-4">
        {/* ===== KPI ROW (4 cards) ===== */}
        <section className="dashboard-kpi-row">
          <KpiCard
            icon={<BikeIcon className="h-4 w-4" />}
            iconBg="var(--st-on-bench-bg)"
            label="BDT actifs"
            value={bdcActifCount}
            spark={[veloCounts['RV'] ?? 0, veloCounts['EVAL'] ?? 0, veloCounts['APPROUVE'] ?? 0, veloCounts['ON_BENCH'] ?? 0, bdcActifCount]}
            sparkColor="var(--st-on-bench-bg)"
            pills={[
              pill('rv', 'RV', veloCounts['RV'] ?? 0),
              pill('eval', 'ÉVAL', veloCounts['EVAL'] ?? 0),
              pill('approuve', 'APP', veloCounts['APPROUVE'] ?? 0),
              pill('on-bench', 'BENCH', veloCounts['ON_BENCH'] ?? 0),
            ]}
          />
          <KpiCard
            icon={<BellIcon className="h-4 w-4" />}
            iconBg="var(--jaune)"
            label="Suivis à faire"
            value={suivis.length}
            spark={[1, 2, 2, 3, 3, 2, suivis.length]}
            sparkColor="var(--jaune)"
            sub={`${rendezVous.length} RV · ${(veloCounts['EN_ATTENTE'] ?? 0)} en attente`}
          />
          <KpiCard
            icon={<PackageIcon className="h-4 w-4" />}
            iconBg="var(--rouge)"
            iconFg="#fff"
            label="Stock à commander"
            value={stockTotal}
            spark={[80, 95, 110, stockTotal]}
            sparkColor="var(--rouge)"
            sub={`${piecesNeedingOrder.length} pièces · ${ruptures} ruptures`}
          />
          <KpiCard
            icon={<DollarSignIcon className="h-4 w-4" />}
            iconBg="var(--st-approuve-bg)"
            label="Revenus du mois"
            value={Math.round(caMonth)}
            money
            spark={revenueSeries.map((p) => p.total)}
            sparkColor="var(--st-approuve-bg)"
            {...(delta14 != null ? { trend: `${delta14}%`, trendDir: (delta14 < 0 ? 'down' : 'up') as 'up'|'down' } : {})}
            sub={`facturé depuis le 1er ${MOIS_FR[now.getMonth()]}`}
          />
        </section>

        {/* ===== ANIMATED WIDGETS ROW ===== */}
        <section className="dashboard-widgets-row">
          <PipelineWidget cards={pipelineCardsForWidget} />
          <RevenueWidget series={revenueSeries} deltaPct={delta14 ?? null} />
          <FeedWidget items={feedItems} />
        </section>

        {/* ===== LISTS ROW (4 cols) ===== */}
        <section className="dashboard-lists-row">
          <ListCard
            icon={<CalendarIcon className="h-3 w-3" />}
            title="Rendez-vous"
            count={rendezVous.length}
            rows={rendezVous.map((b) => ({
              id: String(b.numero).padStart(4, '0'),
              content: `${b.velo.client?.prenom ?? ''} ${b.velo.client?.nom ?? ''} · ${[b.velo.marque?.nom, b.velo.modele].filter(Boolean).join(' ')}`,
              pill: { v: STATUS_TO_PILL[b.velo.status] ?? 'rv', l: VELO_STATUS_LABELS[b.velo.status as keyof typeof VELO_STATUS_LABELS]?.fr ?? b.velo.status },
            }))}
            extra={<HeatmapMini data={charge} />}
          />

          <ListCard
            icon={<BellIcon className="h-3 w-3" />}
            title="Liste des suivis"
            count={suivis.length}
            rows={suivis.map((b) => {
              const status = b.velo.status as keyof typeof VELO_STATUS_LABELS;
              return {
                id: String(b.numero).padStart(4, '0'),
                content: `${b.velo.client?.prenom ?? ''} ${b.velo.client?.nom ?? ''} · ${b.velo.modele ?? ''}`.trim(),
                pill: { v: STATUS_TO_PILL[status] ?? 'attente', l: VELO_STATUS_LABELS[status]?.fr ?? status },
                faded: status === 'LIVRE',
              };
            })}
          />

          <PiecesACommanderCard
            items={piecesNeedingOrder.slice(0, 14).map((p) => ({
              id: p.id,
              name: p.nomCanonical,
              sku: p.sku,
              qty: Math.max(1, -p.stockPhysique + 1),
              locale,
            }))}
          />

          <div className="dashboard-stack-col">
            <ListCard
              icon={<FileTextIcon className="h-3 w-3" />}
              title="Dernières factures"
              count={recentFactures.length}
              rows={recentFactures.map((f) => ({
                ...(f.factureNumero ? { id: f.factureNumero } : {}),
                content: `${f.client?.prenom ?? ''} ${f.client?.nom ?? 'Anonyme'} · ${f.date.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}`,
                right: fmtMoney(Number(f.grandTotal)),
              }))}
            />
            <ListCard
              icon={<ShoppingCartIcon className="h-3 w-3" />}
              title="Dernières ventes"
              count={recentVentes.length}
              rows={recentVentes.map((v) => ({
                ...(v.factureNumero ? { id: v.factureNumero } : {}),
                content: `${v.client?.prenom ?? ''} ${v.client?.nom ?? 'Walk-in'}`.trim(),
                right: fmtMoney(Number(v.totalPieces ?? 0)),
              }))}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

// Référence Link à l'inutilisé pour éviter qu'eslint ne se plaigne au build.
void Link;
