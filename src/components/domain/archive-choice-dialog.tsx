'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export type ArchiveChoice = 'COMPTANT' | 'INTERAC' | 'CARTES' | 'REFUSE';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Callback déclenché au clic d'un des 4 boutons.
   *
   * - COMPTANT / INTERAC / CARTES → marquer la facture PAYÉE avec le mode +
   *   archiver le BDT (status = ARCHIVE_FACTURE).
   * - REFUSE → archiver le BDT en ARCHIVE_REFUSE sans toucher la facture.
   *
   * Le parent gère la mutation (server action) — ce composant ne fait
   * que la confirmation visuelle.
   */
  onChoose: (choice: ArchiveChoice) => void | Promise<void>;
  /** Total restant à payer (affiché pour rappel). */
  resteAPayer?: number;
};

const fmt = (n: number) => n.toFixed(2).replace('.', ',') + ' $';

/**
 * Dialog d'archivage V1 (v1.0.19) — 4 boutons en un clic :
 * Comptant / Interac / Cartes (marquent PAYÉ + archivent) ou Refusé
 * (archive en refusé sans toucher la facture).
 *
 * Pattern récent V1 (cf. v1-ui-bundle.md section 5) — accélère le flow
 * caisse en un seul tap au lieu de 3 étapes.
 */
export function ArchiveChoiceDialog({ open, onOpenChange, onChoose, resteAPayer }: Props) {
  const [busy, setBusy] = React.useState<ArchiveChoice | null>(null);

  const handle = async (c: ArchiveChoice) => {
    setBusy(c);
    try {
      await onChoose(c);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archiver le BDT</DialogTitle>
          <DialogDescription>
            Choisis le mode de paiement pour marquer la facture payée et
            archiver le BDT en un clic. Ou refusé si le client n&apos;a pas
            accepté.
          </DialogDescription>
        </DialogHeader>

        {resteAPayer != null && resteAPayer > 0 ? (
          <div className="rounded-xl bg-[var(--jaune)] p-3 text-center">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
              Reste à encaisser
            </div>
            <div className="font-mono text-2xl font-extrabold">{fmt(resteAPayer)}</div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <PaiementBtn
            label="Comptant"
            busy={busy === 'COMPTANT'}
            onClick={() => handle('COMPTANT')}
          />
          <PaiementBtn
            label="Interac"
            busy={busy === 'INTERAC'}
            onClick={() => handle('INTERAC')}
          />
          <PaiementBtn
            label="Cartes"
            busy={busy === 'CARTES'}
            onClick={() => handle('CARTES')}
          />
        </div>

        <button
          type="button"
          onClick={() => handle('REFUSE')}
          disabled={busy !== null}
          className={cn(
            'mt-2 w-full rounded-full bg-[var(--rouge)] px-5 py-2.5 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors',
            'hover:bg-[var(--rouge-h)] disabled:cursor-not-allowed disabled:opacity-40',
          )}
        >
          {busy === 'REFUSE' ? 'En cours…' : 'Refusé par client'}
        </button>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Annuler</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PaiementBtn({
  label,
  busy,
  onClick,
}: {
  label: string;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={cn(
        'rounded-full bg-[var(--jaune)] px-4 py-3 text-sm font-bold uppercase tracking-[0.1em] text-black transition-colors',
        'hover:bg-[var(--jaune-h)] disabled:cursor-not-allowed disabled:opacity-40',
      )}
    >
      {busy ? '…' : label}
    </button>
  );
}
