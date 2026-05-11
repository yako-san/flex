'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PillsToggle } from '@/components/ui/pills-toggle';

export type AvanceMode = 'COMPTANT' | 'INTERAC' | 'CARTES';

export type Avance = {
  montant: number;
  mode: AvanceMode;
  note: string | null;
};

type Props = {
  /** Sous-totaux (avant remise + taxes). Décimal en string ou number. */
  sousTotalServices: number;
  sousTotalPieces: number;
  /** Remises appliquées (montants déjà calculés en $). */
  remiseServicesMontant?: number;
  remisePiecesMontant?: number;
  /** Taxes (TPS 5% / TVQ 9.975% au QC, mais on prend les valeurs servies). */
  tps: number;
  tvq: number;
  grandTotal: number;
  /** Avance client courante (null = pas d'avance). */
  avance?: Avance | null;
  /** Callback quand l'utilisateur édite l'avance via le modal. */
  onAvanceChange?: (next: Avance | null) => void;
  className?: string;
};

const fmt = (n: number) => n.toFixed(2).replace('.', ',') + ' $';

const modeLabel: Record<AvanceMode, string> = {
  COMPTANT: 'Comptant',
  INTERAC: 'Interac',
  CARTES: 'Cartes',
};

/**
 * Panneau totaux V1 — sous-totaux + remises + taxes + grand total.
 *
 * Particularités V1 (cf. v1-ui-bundle.md section 7) :
 *   - Pill « avance ? » cliquable intégré à côté du grand total. Au clic →
 *     ouvre modal édition (montant + mode + note).
 *   - Si avance saisie : pill devient « avance : 50,00 $ · Interac »
 *     cliquable, total grand barré, **reste-à-payer en gros jaune**.
 *   - Format monospace aligné droite (lecture comptable).
 */
export function BDCTotaux({
  sousTotalServices,
  sousTotalPieces,
  remiseServicesMontant = 0,
  remisePiecesMontant = 0,
  tps,
  tvq,
  grandTotal,
  avance,
  onAvanceChange,
  className,
}: Props) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const reste = avance ? Math.max(0, grandTotal - avance.montant) : null;

  return (
    <aside
      className={cn(
        'flex flex-col gap-2 rounded-xl border border-[var(--gris-bord)] bg-white p-4 shadow-sm',
        className,
      )}
      aria-label="Totaux du BDT"
    >
      <Line label="Sous-total services" value={sousTotalServices} />
      {remiseServicesMontant > 0 ? (
        <Line label="Remise services" value={-remiseServicesMontant} muted negative />
      ) : null}
      <Line label="Sous-total pièces" value={sousTotalPieces} />
      {remisePiecesMontant > 0 ? (
        <Line label="Remise pièces" value={-remisePiecesMontant} muted negative />
      ) : null}
      <Divider />
      <Line label="TPS" value={tps} muted />
      <Line label="TVQ" value={tvq} muted />
      <Divider />
      <Line
        label="Grand total"
        value={grandTotal}
        bold
        strike={!!avance}
      />

      {/* Pill « avance ? » — version compacte intégrée */}
      <div className="mt-2">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className={cn(
            'inline-flex w-full items-center justify-between gap-2 rounded-full bg-[var(--overlay-dark-20)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-black/40',
          )}
        >
          {avance ? (
            <span className="flex items-center gap-2">
              <span>avance :</span>
              <span className="font-mono">{fmt(avance.montant)}</span>
              <span className="opacity-70">· {modeLabel[avance.mode]}</span>
            </span>
          ) : (
            <span className="underline underline-offset-2">avance&nbsp;?</span>
          )}
          <span aria-hidden>›</span>
        </button>
      </div>

      {/* Reste à payer (gros jaune) si avance saisie */}
      {reste !== null ? (
        <div
          className={cn(
            'mt-3 rounded-xl bg-[var(--jaune)] p-3 text-right',
          )}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
            Reste à payer
          </div>
          <div className="font-mono text-2xl font-extrabold text-black">{fmt(reste)}</div>
        </div>
      ) : null}

      <AvanceModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        avance={avance ?? null}
        onSave={(next) => {
          onAvanceChange?.(next);
          setModalOpen(false);
        }}
      />
    </aside>
  );
}

function Line({
  label,
  value,
  bold,
  muted,
  strike,
  negative,
}: {
  label: string;
  value: number;
  bold?: boolean;
  muted?: boolean;
  strike?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className={muted ? 'text-[var(--text-secondary-60)]' : 'text-[var(--dark)]'}>
        {label}
      </span>
      <span
        className={cn(
          'font-mono tabular-nums',
          bold && 'text-base font-bold',
          strike && 'line-through text-[var(--text-secondary-60)]',
          negative && 'text-[var(--rouge)]',
        )}
      >
        {value < 0 ? `−${fmt(-value)}` : fmt(value)}
      </span>
    </div>
  );
}

function Divider() {
  return <hr className="my-1 border-[var(--gris-bord)]" />;
}

function AvanceModal({
  open,
  onOpenChange,
  avance,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  avance: Avance | null;
  onSave: (next: Avance | null) => void;
}) {
  const [montant, setMontant] = React.useState<number | null>(avance?.montant ?? null);
  const [mode, setMode] = React.useState<AvanceMode>(avance?.mode ?? 'INTERAC');
  const [note, setNote] = React.useState(avance?.note ?? '');

  // Re-sync local state when modal opens with current avance
  React.useEffect(() => {
    if (open) {
      setMontant(avance?.montant ?? null);
      setMode(avance?.mode ?? 'INTERAC');
      setNote(avance?.note ?? '');
    }
  }, [open, avance]);

  const handleSave = () => {
    if (montant == null || montant <= 0) {
      onSave(null);
    } else {
      onSave({ montant, mode, note: note.trim() || null });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Avance client</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="avance-montant">Montant</Label>
            <Input
              id="avance-montant"
              type="number"
              inputMode="decimal"
              min={0}
              step={0.01}
              value={montant ?? ''}
              onChange={(e) => setMontant(e.target.value === '' ? null : Number(e.target.value))}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label>Mode de paiement</Label>
            <PillsToggle
              aria-label="Mode de paiement"
              options={[
                { value: 'COMPTANT', label: 'Comptant' },
                { value: 'INTERAC', label: 'Interac' },
                { value: 'CARTES', label: 'Cartes' },
              ]}
              value={mode}
              onChange={(v) => setMode(v as AvanceMode)}
              size="sm"
            />
          </div>
          <div>
            <Label htmlFor="avance-note">Note (optionnel)</Label>
            <Input
              id="avance-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ex: reçu papier #123"
            />
          </div>
        </div>
        <DialogFooter>
          {avance ? (
            <Button variant="danger" onClick={() => onSave(null)}>
              Retirer l&apos;avance
            </Button>
          ) : null}
          <DialogClose asChild>
            <Button variant="secondary">Annuler</Button>
          </DialogClose>
          <Button variant="primary" onClick={handleSave}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
