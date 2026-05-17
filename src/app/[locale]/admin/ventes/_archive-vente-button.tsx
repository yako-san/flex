'use client';

import * as React from 'react';
import { Archive } from 'lucide-react';
import { toast } from 'sonner';
import { customConfirm } from '@/components/ui/confirm-dialog';
import { archiveVenteAction } from './actions';

type Props = {
  venteId: string;
  facture: boolean;
  paid: boolean;
};

/**
 * Bouton icône Archive — soft-delete d'une vente directe.
 * Cluster 4 item m : autorisé uniquement si facturée ET payée.
 *
 * 3 états :
 *   - non facturée  → disabled (utiliser deleteVenteAction à la place)
 *   - facturée pas payée → disabled + tooltip explicatif
 *   - facturée payée → enabled, confirm modal puis soft-delete
 */
export function ArchiveVenteButton({ venteId, facture, paid }: Props) {
  const [pending, startTransition] = React.useTransition();

  if (!facture) {
    return (
      <button
        type="button"
        title="Brouillon — utilise « Supprimer » dans la page détail"
        disabled
        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-secondary-35)] opacity-40"
        aria-label="Archiver (brouillon)"
      >
        <Archive size={14} aria-hidden />
      </button>
    );
  }

  if (!paid) {
    return (
      <button
        type="button"
        title="Marque la vente comme payée avant d'archiver"
        disabled
        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-secondary-35)] opacity-40"
        aria-label="Archiver (paiement requis)"
      >
        <Archive size={14} aria-hidden />
      </button>
    );
  }

  const handleArchive = async () => {
    const ok = await customConfirm({
      title: 'Archiver cette vente ?',
      message:
        'La vente sera masquée de la liste. Les mouvements de stock et la facture restent intacts.',
      confirmLabel: 'Archiver',
      variant: 'danger',
    });
    if (!ok) return;
    startTransition(async () => {
      const res = await archiveVenteAction(venteId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Vente archivée');
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleArchive}
      disabled={pending}
      title="Archiver la vente (soft-delete)"
      aria-label="Archiver la vente"
      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/10 text-[var(--text-secondary-70)] hover:bg-black/20 disabled:opacity-60"
    >
      <Archive size={14} aria-hidden />
    </button>
  );
}
