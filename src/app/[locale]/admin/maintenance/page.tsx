import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';
import { DeleteBdcForm } from './delete-bdc-form';
import { RecomputeStockButton } from './recompute-stock-button';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export default async function MaintenancePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const workshop = await getActiveWorkshop();
  if (!workshop) return <p>Aucun workshop actif.</p>;

  // Stats utiles pour diagnostiquer la santé des données
  const [
    bdcSoftDeleted,
    veloOrphelin,
    pieceStockNegatif,
    bdcSansVelo,
    venteBrouillon,
  ] = await Promise.all([
    prisma.bdc.count({ where: { workshopId: workshop.id, deletedAt: { not: null } } }),
    prisma.velo.count({
      where: { workshopId: workshop.id, deletedAt: null, bdcs: { none: {} } },
    }),
    prisma.piece.count({
      where: { workshopId: workshop.id, deletedAt: null, stockPhysique: { lt: 0 } },
    }),
    // Compte les BDT dont le velo a été soft-deleted
    prisma.bdc.count({
      where: {
        workshopId: workshop.id,
        deletedAt: null,
        velo: { deletedAt: { not: null } },
      },
    }),
    prisma.venteDirecte.count({
      where: { workshopId: workshop.id, deletedAt: null, factureNumero: null },
    }),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="opérations destructives"
        title="Maintenance"
        subline={`Workshop : ${workshop.name}`}
      />
      <div className="mx-auto max-w-[800px] p-6">
      <p style={{ color: '#666', marginTop: 0, marginBottom: '1.5rem' }}>
        ⚠️ Ces opérations affectent les données du workshop {workshop.name}. Pas de
        bouton « annuler » — vérifie deux fois avant de cliquer.
      </p>

      <h2 style={h2}>Diagnostic</h2>
      <div style={panelStyle}>
        <Stat label="BDT soft-deleted (deletedAt non-null)" value={bdcSoftDeleted} />
        <Stat label="Vélos sans aucun BDT (orphelins potentiels)" value={veloOrphelin} />
        <Stat label="BDT actifs avec vélo soft-deleted" value={bdcSansVelo} {...(bdcSansVelo > 0 ? { accent: '#c62828' } : {})} />
        <Stat label="Pièces avec stock physique négatif" value={pieceStockNegatif} {...(pieceStockNegatif > 0 ? { accent: '#c62828' } : {})} />
        <Stat label="Ventes brouillon (jamais facturées)" value={venteBrouillon} />
      </div>

      <h2 style={{ ...h2, marginTop: '2rem' }}>Snapshot complet de la base</h2>
      <p style={{ color: '#666', fontSize: '0.9rem' }}>
        Télécharge un fichier JSON contenant <strong>toutes les données</strong> du
        workshop actif (clients, vélos, BDT, ventes, factures, mouvements de
        stock, audit logs, etc.). Lecture seule, ne modifie rien. Utile pour
        backup avant opération destructive ou audit point-in-time.
      </p>
      <a
        href="/api/admin/snapshot"
        style={{
          display: 'inline-block',
          padding: '0.55rem 1.1rem',
          background: '#1565c0',
          color: 'white',
          border: 0,
          borderRadius: 4,
          textDecoration: 'none',
          fontSize: '0.9rem',
        }}
      >
        ⬇ Télécharger snapshot JSON
      </a>

      <h2 style={{ ...h2, marginTop: '2rem' }}>Recalculer le stock</h2>
      <p style={{ color: '#666', fontSize: '0.9rem' }}>
        Reconstruit <code>Piece.stockPhysique</code> et <code>Piece.stockReserve</code>{' '}
        depuis la table <code>StockMovement</code> (source de vérité). Utile après
        un import ou pour corriger un désalignement.
      </p>
      <RecomputeStockButton />

      <h2 style={{ ...h2, marginTop: '2rem' }}>Supprimer un BDT par ID</h2>
      <p style={{ color: '#666', fontSize: '0.9rem' }}>
        Soft-delete (positionne <code>deletedAt</code>). Refusé si le BDT a une
        facture émise — pour préserver l&apos;intégrité comptable. Pour ces cas-là,
        passer par la BD directement avec un comptable.
      </p>
      <DeleteBdcForm />
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid #f5f5f5' }}>
      <span style={{ color: '#666', fontSize: '0.9rem' }}>{label}</span>
      <span
        style={{
          fontFamily: 'monospace',
          fontWeight: 600,
          color: accent ?? (value > 0 ? '#1a1a1a' : '#888'),
        }}
      >
        {value.toLocaleString('fr-CA')}
      </span>
    </div>
  );
}

const h2: React.CSSProperties = { fontSize: '1.15rem', marginTop: '1.5rem', marginBottom: '0.75rem' };
const panelStyle: React.CSSProperties = {
  background: 'white',
  border: '1px solid #e0e0e0',
  borderRadius: 6,
  padding: '0.75rem 1rem',
};
