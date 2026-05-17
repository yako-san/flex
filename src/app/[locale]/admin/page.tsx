import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import Decimal from 'decimal.js';
import { Bike, Package, Bell, DollarSign, Calendar, Wrench, Mail, FileText, ShoppingCart } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';
import { Pill } from '@/components/ui/pill';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string }>;
};

const MOIS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export default async function AdminDashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const workshop = await getActiveWorkshop();

  if (!workshop) {
    return (
      <div>
        <PageHeader eyebrow="atelier" title="Tableau de bord" />
        <p className="p-6 text-sm text-[var(--text-secondary-60)]">
          Aucun workshop importé. Va dans <strong>Import v1</strong> pour charger le dump.
        </p>
      </div>
    );
  }

  const wid = workshop.id;
  const now = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const eyebrow = `${MOIS_FR[now.getMonth()]} ${now.getFullYear()}`;

  const [
    bdcActifCount,
    bdcByEvalStatus,
    revenueMonth,
    stockLow,
    recentFactures,
    recentVentes,
    rendezVous,
    bdtTermines,
    bdtSuivi,
  ] = await Promise.all([
    prisma.bdc.count({ where: { workshopId: wid, deletedAt: null, archiveStatus: 'ACTIF' } }),
    prisma.bdc.groupBy({
      by: ['evalStatus'],
      where: { workshopId: wid, deletedAt: null, archiveStatus: 'ACTIF' },
      _count: { _all: true },
    }),
    prisma.factureLog.aggregate({
      where: { workshopId: wid, date: { gte: startMonth } },
      _sum: { grandTotal: true },
    }),
    prisma.piece.findMany({
      where: { workshopId: wid, deletedAt: null, stockPhysique: { lte: 0 } },
      select: { id: true, sku: true, nomCanonical: true, stockPhysique: true, stockReserve: true },
      orderBy: { stockPhysique: 'asc' },
      take: 20,
    }),
    prisma.factureLog.findMany({
      where: { workshopId: wid },
      orderBy: { date: 'desc' },
      take: 6,
      select: {
        id: true,
        factureNumero: true,
        date: true,
        grandTotal: true,
        client: { select: { prenom: true, nom: true } },
      },
    }),
    prisma.venteDirecte.findMany({
      where: { workshopId: wid, deletedAt: null, factureNumero: { not: null } },
      orderBy: { factureDate: 'desc' },
      take: 5,
      select: {
        id: true,
        factureNumero: true,
        factureDate: true,
        totalPieces: true,
        client: { select: { prenom: true, nom: true } },
      },
    }),
    prisma.bdc.findMany({
      where: {
        workshopId: wid,
        deletedAt: null,
        velo: { status: { in: ['RV', 'RECU'] } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 6,
      select: {
        id: true,
        numero: true,
        evalStatus: true,
        velo: {
          select: {
            status: true,
            date2: true,
            client: { select: { prenom: true, nom: true } },
            marque: { select: { nom: true } },
            modele: true,
          },
        },
      },
    }),
    prisma.bdc.findMany({
      where: {
        workshopId: wid,
        deletedAt: null,
        velo: { status: { in: ['CTRL_QLTE', 'FINI', 'FACTURER', 'FACTURE'] } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 6,
      select: {
        id: true,
        numero: true,
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
    prisma.bdc.findMany({
      where: {
        workshopId: wid,
        deletedAt: null,
        cbBonSortie: true,
        cbSuiviEnvoye: false,
        velo: { status: 'LIVRE' },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        numero: true,
        velo: {
          select: {
            client: { select: { prenom: true, nom: true } },
            marque: { select: { nom: true } },
            modele: true,
          },
        },
      },
    }),
  ]);

  const evalCounts: Record<string, number> = {};
  for (const r of bdcByEvalStatus) evalCounts[r.evalStatus] = r._count._all;

  const caMonth = new Decimal(revenueMonth._sum.grandTotal?.toString() ?? '0').toNumber();
  const stockNegatif = stockLow.reduce((acc, p) => acc + Math.max(0, -p.stockPhysique), 0);

  return (
    <div>
      <PageHeader
        eyebrow={eyebrow}
        title="Dashboard"
        actions={
          <div className="hidden gap-1 sm:flex">
            <a
              href={`https://docs.google.com/spreadsheets`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[var(--gris-bord)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)] hover:bg-[var(--gris-fond)]"
            >
              Sheets
            </a>
            <a
              href={`https://drive.google.com`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[var(--gris-bord)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)] hover:bg-[var(--gris-fond)]"
            >
              Drive
            </a>
            <a
              href={`https://mail.google.com`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[var(--gris-bord)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)] hover:bg-[var(--gris-fond)]"
            >
              Gmail
            </a>
            <a
              href={`https://contacts.google.com`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[var(--gris-bord)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)] hover:bg-[var(--gris-fond)]"
            >
              Contacts
            </a>
          </div>
        }
      />

      <div className="bloc-contenu space-y-6 p-6">
        {/* 4 KPI cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={<Bike size={18} />}
            iconBg="var(--st-on-bench-bg)"
            label="BDT actifs"
            value={bdcActifCount}
          >
            <div className="mt-2 flex flex-wrap gap-1">
              {(['INDECIS', 'ATTENTE', 'APPROUVE', 'REDUX'] as const).map((s) => {
                const n = evalCounts[s] ?? 0;
                if (n === 0) return null;
                const variant = s === 'APPROUVE' ? 'approuve' : s === 'ATTENTE' ? 'attente' : s === 'REDUX' ? 'eval' : 'neutral';
                return (
                  <Pill key={s} variant={variant} size="sm">
                    {n} {s.toLowerCase()}
                  </Pill>
                );
              })}
            </div>
          </KpiCard>

          <KpiCard
            icon={<Package size={18} />}
            iconBg="var(--rouge)"
            iconFg="white"
            label="Stock à commander"
            value={stockLow.length}
            sub={stockNegatif > 0 ? `${stockNegatif} unités du stock` : 'pièces à 0 ou moins'}
          />

          <KpiCard
            icon={<Bell size={18} />}
            iconBg="var(--jaune)"
            label="Suivis"
            value={bdtSuivi.length}
            sub="factures à suivre"
          />

          <KpiCard
            icon={<DollarSign size={18} />}
            iconBg="var(--st-approuve-bg)"
            label="Revenus du mois"
            value={`${caMonth.toFixed(2)} $`}
            sub={`facturé depuis le 1er ${MOIS_FR[now.getMonth()]}`}
          />
        </section>

        {/* 3 colonnes V1 — Rendez-vous + Terminés + Suivi / Pièces / Factures + Ventes */}
        <div className="grid gap-4 lg:grid-cols-3 items-start">
          {/* Col 1 : Rendez-vous + BDT Terminés + BDT Suivi */}
          <div className="space-y-4">
            <DashSection icon={<Calendar size={16} />} title="Rendez-vous" count={rendezVous.length}>
              {rendezVous.length === 0 ? (
                <EmptyState>Aucun BDT en RV/REÇU.</EmptyState>
              ) : (
                <ul className="space-y-1.5">
                  {rendezVous.map((b) => (
                    <li key={b.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-xs hover:bg-[var(--gris-fond)]">
                      <Link href={`/${locale}/admin/inventaire/${b.id}`} className="font-mono font-semibold text-[var(--dark)] hover:underline">
                        {String(b.numero).padStart(4, '0')}
                      </Link>
                      <span className="flex-1 truncate text-[var(--text-secondary-70)]">
                        {b.velo.client ? `${b.velo.client.prenom} ${b.velo.client.nom}` : 'walk-in'} · {[b.velo.marque?.nom, b.velo.modele].filter(Boolean).join(' ')}
                      </span>
                      <Pill variant={b.velo.status === 'RV' ? 'rv' : 'recu'} size="sm">
                        {b.velo.status === 'RV' ? 'rv' : 'reçu'}
                      </Pill>
                    </li>
                  ))}
                </ul>
              )}
            </DashSection>

            <DashSection icon={<Wrench size={16} />} title="BDT — Terminés" count={bdtTermines.length}>
              {bdtTermines.length === 0 ? (
                <EmptyState>Aucun BDT en CTRL QLTÉ/FINI/FACTURER.</EmptyState>
              ) : (
                <ul className="space-y-1.5">
                  {bdtTermines.map((b) => (
                    <li key={b.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-xs hover:bg-[var(--gris-fond)]">
                      <Link href={`/${locale}/admin/inventaire/${b.id}`} className="font-mono font-semibold text-[var(--dark)] hover:underline">
                        {String(b.numero).padStart(4, '0')}
                      </Link>
                      <span className="flex-1 truncate text-[var(--text-secondary-70)]">
                        {b.velo.client ? `${b.velo.client.prenom} ${b.velo.client.nom}` : 'walk-in'} · {[b.velo.marque?.nom, b.velo.modele].filter(Boolean).join(' ')}
                      </span>
                      <Pill variant={b.velo.status === 'FACTURE' ? 'facture' : b.velo.status === 'FACTURER' ? 'facturer' : 'ctrl-qlte'} size="sm">
                        {b.velo.status.toLowerCase().replace('_', ' ')}
                      </Pill>
                    </li>
                  ))}
                </ul>
              )}
            </DashSection>

            <DashSection icon={<Mail size={16} />} title="BDT — Suivi à envoyer" count={bdtSuivi.length}>
              {bdtSuivi.length === 0 ? (
                <EmptyState>Aucun BDT livré sans suivi.</EmptyState>
              ) : (
                <ul className="space-y-1.5">
                  {bdtSuivi.map((b) => (
                    <li key={b.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-xs hover:bg-[var(--gris-fond)]">
                      <Link href={`/${locale}/admin/inventaire/${b.id}`} className="font-mono font-semibold hover:underline">
                        {String(b.numero).padStart(4, '0')}
                      </Link>
                      <span className="flex-1 truncate text-[var(--text-secondary-70)]">
                        {b.velo.client ? `${b.velo.client.prenom} ${b.velo.client.nom}` : 'walk-in'} · {[b.velo.marque?.nom, b.velo.modele].filter(Boolean).join(' ')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </DashSection>
          </div>

          {/* Col 2 : Pièces à commander */}
          <DashSection icon={<Package size={16} />} title="Pièces — stock épuisé" count={stockLow.length}>
            {stockLow.length === 0 ? (
              <EmptyState>Aucune pièce à 0 ou moins.</EmptyState>
            ) : (
              <ul className="space-y-1">
                {stockLow.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-xs hover:bg-[var(--gris-fond)]">
                    <Link href={`/${locale}/admin/pieces/${p.id}/edit`} className="flex-1 truncate hover:underline">
                      {p.sku ? <code className="mr-1 text-[var(--text-secondary-60)]">{p.sku}</code> : null}
                      {p.nomCanonical}
                    </Link>
                    <span className={`font-mono font-semibold tabular-nums ${p.stockPhysique < 0 ? 'text-[var(--rouge)]' : 'text-[var(--text-secondary-60)]'}`}>
                      {p.stockPhysique}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </DashSection>

          {/* Col 3 : Dernières factures + Dernières ventes */}
          <div className="space-y-4">
            <DashSection icon={<FileText size={16} />} title="Dernières factures" count={recentFactures.length}>
              {recentFactures.length === 0 ? (
                <EmptyState>Aucune facture.</EmptyState>
              ) : (
                <ul className="space-y-1.5">
                  {recentFactures.map((f) => (
                    <li key={f.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-xs hover:bg-[var(--gris-fond)]">
                      <span className="font-mono font-semibold">{f.factureNumero ?? '—'}</span>
                      <span className="flex-1 truncate text-[var(--text-secondary-70)]">
                        {f.client ? `${f.client.prenom} ${f.client.nom}`.trim() : '—'}
                      </span>
                      <span className="font-mono tabular-nums">{Number(f.grandTotal).toFixed(2)} $</span>
                    </li>
                  ))}
                </ul>
              )}
            </DashSection>

            <DashSection icon={<ShoppingCart size={16} />} title="Dernières ventes" count={recentVentes.length}>
              {recentVentes.length === 0 ? (
                <EmptyState>Aucune vente.</EmptyState>
              ) : (
                <ul className="space-y-1.5">
                  {recentVentes.map((v) => (
                    <li key={v.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-xs hover:bg-[var(--gris-fond)]">
                      <span className="font-mono font-semibold">{v.factureNumero ?? '—'}</span>
                      <span className="flex-1 truncate text-[var(--text-secondary-70)]">
                        {v.client ? `${v.client.prenom} ${v.client.nom}`.trim() : 'walk-in'}
                      </span>
                      <span className="font-mono tabular-nums">{Number(v.totalPieces).toFixed(2)} $</span>
                    </li>
                  ))}
                </ul>
              )}
            </DashSection>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  iconBg,
  iconFg = 'black',
  label,
  value,
  sub,
  children,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconFg?: string;
  label: string;
  value: string | number;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-[var(--overlay-dark-20)] p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <span
          aria-hidden
          className="inline-flex h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: iconBg, color: iconFg }}
        >
          {icon}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-70)]">
          {label}
        </span>
      </div>
      <div
        className="font-mono text-2xl font-bold tabular-nums"
        style={{ color: 'var(--jaune)' }}
      >
        {value}
      </div>
      {sub ? <div className="mt-1 text-[11px] text-[var(--text-secondary-60)]">{sub}</div> : null}
      {children}
    </div>
  );
}

function DashSection({
  icon,
  title,
  count,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white/85 shadow-sm">
      <header className="flex items-center justify-between px-4 py-2 border-b border-[var(--gris-bord)]">
        <div className="flex items-center gap-2">
          <span className="text-[var(--jaune-h)]" aria-hidden>{icon}</span>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
            {title}
          </h2>
        </div>
        <span className="rounded-full bg-[var(--gris-fond)] px-2 py-0.5 text-[10px] font-mono text-[var(--text-secondary-60)]">
          {count}
        </span>
      </header>
      <div className="max-h-[280px] overflow-y-auto p-2">{children}</div>
    </section>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 py-4 text-center text-[11px] italic text-[var(--text-secondary-60)]">{children}</p>
  );
}
