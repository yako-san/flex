import { setRequestLocale } from 'next-intl/server';
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

  // Compte les entités du workshop en parallèle.
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
  ] = await Promise.all([
    prisma.client.count({ where: { workshopId: workshop.id, deletedAt: null } }),
    prisma.velo.count({ where: { workshopId: workshop.id, deletedAt: null } }),
    prisma.bdc.count({ where: { workshopId: workshop.id, deletedAt: null } }),
    prisma.bdc.count({
      where: { workshopId: workshop.id, deletedAt: null, archiveStatus: 'ACTIF' },
    }),
    prisma.piece.count({ where: { workshopId: workshop.id, deletedAt: null } }),
    prisma.service.count({ where: { workshopId: workshop.id, deletedAt: null } }),
    prisma.forfait.count({ where: { workshopId: workshop.id, deletedAt: null } }),
    prisma.venteDirecte.count({ where: { workshopId: workshop.id, deletedAt: null } }),
    prisma.po.count({ where: { workshopId: workshop.id, deletedAt: null } }),
    prisma.equipeMember.count({ where: { workshopId: workshop.id } }),
  ]);

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{workshop.name}</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        {workshop.country} · {workshop.currency} · {workshop.timezone}
      </p>

      <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Données importées</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '1rem',
        }}
      >
        <Stat label="Clients" value={clientCount} />
        <Stat label="Vélos" value={veloCount} />
        <Stat label="Bons de commande" value={bdcCount} sub={`${bdcActifCount} actifs`} />
        <Stat label="Pièces (catalogue)" value={pieceCount} />
        <Stat label="Services" value={serviceCount} />
        <Stat label="Forfaits" value={forfaitCount} />
        <Stat label="Ventes directes" value={venteCount} />
        <Stat label="POs" value={poCount} />
        <Stat label="Équipe" value={equipeCount} />
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: number; sub?: string }) {
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
      <div style={{ fontSize: '1.75rem', fontWeight: 600, marginTop: '0.25rem' }}>
        {value.toLocaleString('fr-CA')}
      </div>
      {sub ? (
        <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.25rem' }}>{sub}</div>
      ) : null}
    </div>
  );
}
