'use client';

import * as React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { markVentePayeeAction } from './actions';

type Props = {
  venteId: string;
  /** Vrai si la vente a `paidAt != null` côté DB. */
  initialPaid: boolean;
  /** Vrai si la vente est facturée (sinon bouton désactivé). */
  facture: boolean;
};

/**
 * Bouton icône CheckCircle qui toggle l'état payé d'une vente facturée.
 * Optimiste : flip immédiat du state local, rollback si erreur serveur.
 *
 * Cluster 4 item m — port du `CheckCircleIcon` V1
 * (`app/catalogue/ventes/page.tsx` PR V1 #9).
 */
export function PayeeToggleButton({ venteId, initialPaid, facture }: Props) {
  const [paid, setPaid] = React.useState(initialPaid);
  const [pending, startTransition] = React.useTransition();

  if (!facture) {
    return (
      <button
        type="button"
        title="Disponible une fois la vente facturée"
        disabled
        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-secondary-35)] opacity-40"
        aria-label="Marquer payée (indisponible)"
      >
        <CheckCircle2 size={14} aria-hidden />
      </button>
    );
  }

  const handleToggle = () => {
    const next = !paid;
    setPaid(next); // optimiste
    startTransition(async () => {
      const res = await markVentePayeeAction(venteId, next);
      if (res.error) {
        setPaid(!next); // rollback
        toast.error(res.error);
      } else {
        toast.success(next ? 'Vente marquée payée' : 'Statut payé retiré');
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={pending}
      title={paid ? 'Annuler — marquer impayée' : 'Marquer comme payée → archivable'}
      aria-label={paid ? 'Annuler le statut payé' : 'Marquer comme payée'}
      aria-pressed={paid}
      className={
        paid
          ? 'inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#16a34a] text-white shadow-sm hover:bg-[#15803d] disabled:opacity-60'
          : 'inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/10 text-[var(--text-secondary-70)] hover:bg-black/20 disabled:opacity-60'
      }
    >
      <CheckCircle2 size={14} aria-hidden />
    </button>
  );
}
