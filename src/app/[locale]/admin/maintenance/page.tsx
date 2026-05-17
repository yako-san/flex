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
      <div className="bloc-contenu mx-auto max-w-[800px] p-6">
        <p className="mb-6 text-sm text-[var(--text-secondary-60)]">
          ⚠️ Ces opérations affectent les données du workshop {workshop.name}. Pas de
          bouton « annuler » — vérifie deux fois avant de cliquer.
        </p>

        <h2 className="mb-3 mt-6 text-base font-semibold">Diagnostic</h2>
        <div className="rounded-xl border border-[var(--gris-bord)] bg-white/60 px-4 py-3">
          <Stat label="BDT soft-deleted (deletedAt non-null)" value={bdcSoftDeleted} />
          <Stat label="Vélos sans aucun BDT (orphelins potentiels)" value={veloOrphelin} />
          {bdcSansVelo > 0 ? <Stat label="BDT actifs avec vélo soft-deleted" value={bdcSansVelo} accent="var(--rouge)" /> : <Stat label="BDT actifs avec vélo soft-deleted" value={bdcSansVelo} />}
          {pieceStockNegatif > 0 ? <Stat label="Pièces avec stock physique négatif" value={pieceStockNegatif} accent="var(--rouge)" /> : <Stat label="Pièces avec stock physique négatif" value={pieceStockNegatif} />}
          <Stat label="Ventes brouillon (jamais facturées)" value={venteBrouillon} />
        </div>

        <h2 className="mb-3 mt-8 text-base font-semibold">Snapshot complet de la base</h2>
        <p className="mb-3 text-sm text-[var(--text-secondary-60)]">
          Télécharge un fichier JSON contenant <strong>toutes les données</strong> du
          workshop actif (clients, vélos, BDT, ventes, factures, mouvements de
          stock, audit logs, etc.). Lecture seule, ne modifie rien. Utile pour
          backup avant opération destructive ou audit point-in-time.
        </p>
        <a href="/api/admin/snapshot" className="btn-secondary">
          ⬇ Télécharger snapshot JSON
        </a>

        <h2 className="mb-3 mt-8 text-base font-semibold">Recalculer le stock</h2>
        <p className="mb-3 text-sm text-[var(--text-secondary-60)]">
          Reconstruit <code>Piece.stockPhysique</code> et <code>Piece.stockReserve</code>{' '}
          depuis la table <code>StockMovement</code> (source de vérité). Utile après
          un import ou pour corriger un désalignement.
        </p>
        <RecomputeStockButton />

        <h2 className="mb-3 mt-8 text-base font-semibold">Supprimer un BDT par ID</h2>
        <p className="mb-3 text-sm text-[var(--text-secondary-60)]">
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
    <div className="flex items-center justify-between border-b border-[var(--gris-bord)]/40 py-1.5 last:border-0">
      <span className="text-sm text-[var(--text-secondary-60)]">{label}</span>
      <span
        className="font-mono font-semibold"
        style={{ color: accent ?? (value > 0 ? 'var(--dark)' : 'rgba(0,0,0,0.4)') }}
      >
        {value.toLocaleString('fr-CA')}
      </span>
    </div>
  );
}
