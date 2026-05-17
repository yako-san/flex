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
  const affiche = reste ?? grandTotal;
  const detailTitle =
    `Sous-totaux : services ${fmt(sousTotalServices)} · pièces ${fmt(sousTotalPieces)}` +
    (remiseServicesMontant > 0 ? ` · remise svc -${fmt(remiseServicesMontant)}` : '') +
    (remisePiecesMontant > 0 ? ` · remise pcs -${fmt(remisePiecesMontant)}` : '') +
    ` · TPS ${fmt(tps)} · TVQ ${fmt(tvq)}`;

  return (
    <aside
      className={cn(
        // Pill noir compact V1 — horizontal, fond `--dark` (#1a1a1a),
        // texte blanc semi, total en gros jaune à droite. Cliquable au
        // milieu pour la modale avance.
        'flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-full px-5 py-2.5 text-sm shadow-md',
        className,
      )}
      style={{ backgroundColor: 'var(--dark)', color: '#fff' }}
      aria-label="Totaux du BDT"
      title={detailTitle}
    >
      {/* Sous-totaux services + pièces côte à côte */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs">
        <span className="opacity-70">Services</span>
        <span className="font-mono tabular-nums">{fmt(sousTotalServices - remiseServicesMontant)}</span>
        <span className="opacity-40">·</span>
        <span className="opacity-70">Pièces</span>
        <span className="font-mono tabular-nums">{fmt(sousTotalPieces - remisePiecesMontant)}</span>
      </div>

      {/* Pill avance? au centre */}
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition-colors',
          'bg-white/10 hover:bg-white/20',
        )}
      >
        {avance ? (
          <>
            <span className="opacity-70">avance :</span>
            <span className="font-mono">{fmt(avance.montant)}</span>
            <span className="opacity-50">· {modeLabel[avance.mode]}</span>
          </>
        ) : (
          <span className="underline underline-offset-2 opacity-80">avance&nbsp;?</span>
        )}
      </button>

      {/* Grand total / reste à payer — gros jaune à droite */}
      <div className="flex items-baseline gap-2">
        {avance ? (
          <span className="font-mono text-xs line-through opacity-50">{fmt(grandTotal)}</span>
        ) : null}
        <span
          className="font-mono text-xl font-extrabold tabular-nums"
          style={{ color: 'var(--jaune)' }}
        >
          {fmt(affiche)}
        </span>
      </div>

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
