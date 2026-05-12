'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { customConfirm } from '@/components/ui/confirm-dialog';
import { toast } from '@/lib/utils/toast';
import { setFactureStatutAction } from './actions';

type Statut = 'EMIS' | 'PAYE' | 'ANNULE';
type ModePaiement = 'COMPTANT' | 'INTERAC' | 'CARTE' | 'AUTRE';

const STATUT_INFO: Record<Statut, { bg: string; fg: string; label: string }> = {
  EMIS:   { bg: 'var(--st-attente-bg)',   fg: 'var(--st-attente-fg)',   label: 'Émise' },
  PAYE:   { bg: 'var(--st-approuve-bg)',  fg: 'var(--st-approuve-fg)',  label: 'Payée' },
  ANNULE: { bg: 'var(--st-livre-bg)',     fg: 'var(--st-livre-fg)',     label: 'Annulée' },
};

type Props = {
  factureLogId: string;
  statut: Statut;
  modePaiement: ModePaiement | null;
};

export function FactureStatutControls({ factureLogId, statut, modePaiement }: Props) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const c = STATUT_INFO[statut];

  const update = (newStatut: Statut, newMode?: ModePaiement) => {
    start(async () => {
      const r = await setFactureStatutAction(
        factureLogId,
        newStatut,
        newMode ?? modePaiement ?? null,
      );
      if (r.error) {
        toast(r.error, 'error');
      } else {
        setOpen(false);
        router.refresh();
      }
    });
  };

  const handleAnnule = async () => {
    const ok = await customConfirm({
      title: 'Marquer cette facture comme annulée ?',
      message: 'Le numéro est conservé pour la séquence, mais elle n\'est plus comptabilisée.',
      confirmLabel: 'Annuler la facture',
      variant: 'danger',
    });
    if (ok) update('ANNULE');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={pending}
          title="Cliquer pour changer le statut"
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-opacity hover:opacity-80 disabled:cursor-wait"
          style={{ backgroundColor: c.bg, color: c.fg }}
        >
          {c.label}
          {statut === 'PAYE' && modePaiement ? (
            <span className="font-normal opacity-70">({modePaiement.toLowerCase()})</span>
          ) : null}
          <span className="text-[9px]">▾</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="start">
        {statut !== 'EMIS' ? (
          <MenuItem onClick={() => update('EMIS')} disabled={pending}>
            Marquer émise (non payée)
          </MenuItem>
        ) : null}
        {statut !== 'PAYE' ? (
          <>
            <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-[var(--text-secondary-60)]">
              Marquer payée — mode
            </div>
            {(['COMPTANT', 'INTERAC', 'CARTE', 'AUTRE'] as const).map((m) => (
              <MenuItem key={m} onClick={() => update('PAYE', m)} disabled={pending}>
                ✓ {m.toLowerCase()}
              </MenuItem>
            ))}
          </>
        ) : null}
        {statut !== 'ANNULE' ? (
          <MenuItem onClick={handleAnnule} disabled={pending} danger>
            Annuler
          </MenuItem>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

function MenuItem({
  onClick,
  disabled,
  danger,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`block w-full rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-[var(--gris-fond)] disabled:opacity-50 ${danger ? 'text-[var(--rouge)]' : ''}`}
    >
      {children}
    </button>
  );
}
