import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import Decimal from 'decimal.js';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AdminDashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const workshop = await getActiveWorkshop();

  if (!workshop) {
    return (
      <div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Tableau de bord</h1>
        <p style={{ color: '#666' }}>
          Aucun workshop importé. Va dans <strong>Import v1</strong> pour charger le dump.
        </p>
      </div>
    );
  }

  const wid = workshop.id;
  const now = new Date();
  const start30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    clientCount,
    veloCount,
    bdcCount,
    bdcActifCount,
    pieceCount,
    serviceCount,
    forfaitCount,
    venteCount,
    poCount,
    equipeCount,
    bdcByEvalStatus,
    revenue30,
    revenueMonth,
    factureCount30,
    bdcCreated30,
    posPending,
    stockLow,
    topPieces30,
  ] = await Promise.all([
    prisma.client.count({ where: { workshopId: wid, deletedAt: null } }),
    prisma.velo.count({ where: { workshopId: wid, deletedAt: null } }),
    prisma.bdc.count({ where: { workshopId: wid, deletedAt: null } }),
    prisma.bdc.count({ where: { workshopId: wid, deletedAt: null, archiveStatus: 'ACTIF' } }),
    prisma.piece.count({ where: { workshopId: wid, deletedAt: null } }),
    prisma.service.count({ where: { workshopId: wid, deletedAt: null } }),
    prisma.forfait.count({ where: { workshopId: wid, deletedAt: null } }),
    prisma.venteDirecte.count({ where: { workshopId: wid, deletedAt: null } }),
    prisma.po.count({ where: { workshopId: wid, deletedAt: null } }),
    prisma.equipeMember.count({ where: { workshopId: wid } }),
    prisma.bdc.groupBy({
      by: ['evalStatus'],
      where: { workshopId: wid, deletedAt: null, archiveStatus: 'ACTIF' },
      _count: { _all: true },
    }),
    prisma.factureLog.aggregate({
      where: { workshopId: wid, date: { gte: start30 } },
      _sum: { grandTotal: true },
    }),
    prisma.factureLog.aggregate({
      where: { workshopId: wid, date: { gte: startMonth } },
      _sum: { grandTotal: true },
    }),
    prisma.factureLog.count({ where: { workshopId: wid, date: { gte: start30 } } }),
    prisma.bdc.count({ where: { workshopId: wid, deletedAt: null, createdAt: { gte: start30 } } }),
    prisma.po.count({
      where: {
        workshopId: wid,
        deletedAt: null,
        status: { in: ['EN_ATTENTE', 'PARTIEL'] },
      },
    }),
    prisma.piece.findMany({
      where: { workshopId: wid, deletedAt: null, stockPhysique: { lte: 0 } },
      select: { id: true, sku: true, nomCanonical: true, stockPhysique: true, stockReserve: true },
      orderBy: { stockPhysique: 'asc' },
      take: 8,
    }),
    prisma.venteDirecteItem.groupBy({
      by: ['nomSnapshot'],
      where: {
        vente: { workshopId: wid, deletedAt: null, factureNumero: { not: null }, factureDate: { gte: start30 } },
      },
      _sum: { qty: true, total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 5,
    }),
  ]);

  const evalCounts: Record<string, number> = {};
  for (const r of bdcByEvalStatus) {
    evalCounts[r.evalStatus] = r._count._all;
  }
  const ca30 = new Decimal(revenue30._sum.grandTotal?.toString() ?? '0').toNumber();
  const caMonth = new Decimal(revenueMonth._sum.grandTotal?.toString() ?? '0').toNumber();

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{workshop.name}</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        {workshop.country} · {workshop.currency} · {workshop.timezone}
      </p>

      <h2 style={h2}>Activité (30 derniers jours)</h2>
      <div style={cardsGrid}>
        <Stat label="CA facturé 30j" value={`${ca30.toFixed(2)} $`} accent="#1b5e20" />
        <Stat label="CA mois courant" value={`${caMonth.toFixed(2)} $`} />
        <Stat label="Factures émises 30j" value={factureCount30.toLocaleString('fr-CA')} />
        <Stat label="BDT créés 30j" value={bdcCreated30.toLocaleString('fr-CA')} />
      </div>

      <h2 style={h2}>BDT actifs par statut éval</h2>
      <div style={cardsGrid}>
        {(['INDECIS', 'ATTENTE', 'APPROUVE', 'REDUX', 'REFUSE'] as const).map((s) => (
          <Stat
            key={s}
            label={s}
            value={(evalCounts[s] ?? 0).toLocaleString('fr-CA')}
          />
        ))}
        <Stat label="Total actifs" value={bdcActifCount.toLocaleString('fr-CA')} accent="#1565c0" />
        <Stat label="POs ouverts" value={posPending.toLocaleString('fr-CA')} />
      </div>

      {stockLow.length > 0 || topPieces30.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
          {stockLow.length > 0 ? (
            <div>
              <h2 style={h2}>⚠️ Stock épuisé / négatif</h2>
              <div style={panelStyle}>
                {stockLow.map((p) => (
                  <div key={p.id} style={rowStyle}>
                    <Link href={`/${locale}/admin/pieces/${p.id}/edit`} style={{ color: '#1565c0', textDecoration: 'none', fontSize: '0.9rem' }}>
                      {p.sku ? <code style={{ color: '#888' }}>{p.sku} </code> : null}
                      {p.nomCanonical}
                    </Link>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: p.stockPhysique < 0 ? '#c62828' : '#666' }}>
                      {p.stockPhysique} {p.stockReserve > 0 ? `(${p.stockReserve} rsv)` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {topPieces30.length > 0 ? (
            <div>
              <h2 style={h2}>Top pièces vendues 30j</h2>
              <div style={panelStyle}>
                {topPieces30.map((p, i) => (
                  <div key={`${p.nomSnapshot}-${i}`} style={rowStyle}>
                    <span style={{ fontSize: '0.9rem' }}>{p.nomSnapshot}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {Number(p._sum.qty ?? 0)} × · {Number(p._sum.total ?? 0).toFixed(2)} $
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <h2 style={{ ...h2, marginTop: '2rem' }}>Catalogue & données</h2>
      <div style={cardsGrid}>
        <Stat label="Clients" value={clientCount.toLocaleString('fr-CA')} />
        <Stat label="Vélos" value={veloCount.toLocaleString('fr-CA')} />
        <Stat label="BDT (total)" value={bdcCount.toLocaleString('fr-CA')} sub={`${bdcActifCount} actifs`} />
        <Stat label="Pièces" value={pieceCount.toLocaleString('fr-CA')} />
        <Stat label="Services" value={serviceCount.toLocaleString('fr-CA')} />
        <Stat label="Forfaits" value={forfaitCount.toLocaleString('fr-CA')} />
        <Stat label="Ventes directes" value={venteCount.toLocaleString('fr-CA')} />
        <Stat label="POs" value={poCount.toLocaleString('fr-CA')} />
        <Stat label="Équipe" value={equipeCount.toLocaleString('fr-CA')} />
      </div>
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: 6,
        padding: '1rem',
      }}
    >
      <div style={{ color: '#666', fontSize: '0.85rem' }}>{label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: '0.25rem', color: accent ?? '#1a1a1a', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      {sub ? (
        <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.25rem' }}>{sub}</div>
      ) : null}
    </div>
  );
}

const h2: React.CSSProperties = { fontSize: '1.1rem', marginTop: '1.5rem', marginBottom: '0.75rem' };
const cardsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
  gap: '1rem',
};
const panelStyle: React.CSSProperties = {
  background: 'white',
  border: '1px solid #e0e0e0',
  borderRadius: 6,
  padding: '0.5rem 0.75rem',
};
const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.4rem 0',
  borderBottom: '1px solid #f5f5f5',
  gap: '1rem',
};
