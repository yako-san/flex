import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';
import { PieceForm } from '../../piece-form';
import { AdjustStockForm } from './adjust-form';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string; id: string }> };

const TYPE_LABEL: Record<string, string> = {
  PO_RECEIVED: 'Réception PO',
  BDC_INVOICED: 'Facturation BDT',
  SALE_INVOICED: 'Vente comptoir',
  MANUAL_ADJUSTMENT: 'Ajustement manuel',
  RESERVATION: 'Réservation',
  RELEASE: 'Libération réservation',
};

const TYPE_BADGE: Record<string, string> = {
  PO_RECEIVED: 'bg-green-100 text-green-800',
  BDC_INVOICED: 'bg-red-100 text-red-800',
  SALE_INVOICED: 'bg-pink-100 text-pink-800',
  MANUAL_ADJUSTMENT: 'bg-yellow-100 text-yellow-800',
  RESERVATION: 'bg-blue-100 text-blue-800',
  RELEASE: 'bg-slate-100 text-slate-700',
};

export default async function EditPiecePage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const workshop = await getActiveWorkshop();
  if (!workshop) return <p>Aucun workshop actif.</p>;

  const [p, movements] = await Promise.all([
    prisma.piece.findFirst({
      where: { id, workshopId: workshop.id, deletedAt: null },
    }),
    prisma.stockMovement.findMany({
      where: { pieceId: id, workshopId: workshop.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
  ]);
  if (!p) notFound();

  return (
    <div>
      <PageHeader
        eyebrow="catalogue · modifier pièce"
        title={p.nomCanonical}
      />
      <div className="bloc-contenu mx-auto max-w-[900px] p-6">
        <Link href={`/${locale}/admin/pieces`} className="mb-4 inline-block text-sm text-[var(--text-secondary-60)] hover:text-[var(--dark)]">← Toutes les pièces</Link>
        <p className="mb-6 text-sm text-[var(--text-secondary-70)]">
          Stock physique : <strong>{p.stockPhysique}</strong> · Réservé sur BDT : <strong>{p.stockReserve}</strong> · Disponible : <strong>{p.stockPhysique - p.stockReserve}</strong>
        </p>

        <h2 className="mb-2 mt-4 text-base font-semibold">Ajustement manuel</h2>
        <p className="mb-3 text-sm text-[var(--text-secondary-60)]">
          Pour inventaire physique, perte, retour, etc. Crée un mouvement{' '}
          <code>MANUAL_ADJUSTMENT</code> dans l&apos;audit trail.
        </p>
        <AdjustStockForm pieceId={p.id} currentStock={p.stockPhysique} />

        <h2 className="mb-2 mt-8 text-base font-semibold">Historique des mouvements ({movements.length})</h2>
        {movements.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary-60)]">Aucun mouvement enregistré.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-white/85 shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--gris-bord)] bg-white/50 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-right">Delta</th>
                  <th className="px-3 py-2 text-left">Raison</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => {
                  const badgeCls = TYPE_BADGE[m.type] ?? 'bg-slate-100 text-slate-700';
                  const delta = Number(m.delta);
                  return (
                    <tr key={m.id} className="border-t border-[var(--gris-bord)]/30">
                      <td className="px-3 py-2 text-xs text-[var(--text-secondary-60)]">
                        {m.createdAt.toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${badgeCls}`}>
                          {TYPE_LABEL[m.type] ?? m.type}
                        </span>
                      </td>
                      <td className={`px-3 py-2 text-right font-mono ${delta < 0 ? 'text-red-700' : 'text-green-700'}`}>
                        {delta > 0 ? '+' : ''}{delta}
                      </td>
                      <td className="px-3 py-2 text-xs">{m.reason ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <h2 className="mb-2 mt-8 text-base font-semibold">Modifier la pièce</h2>
        <PieceForm initial={p} />
      </div>
    </div>
  );
}
