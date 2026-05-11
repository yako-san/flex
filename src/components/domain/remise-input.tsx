'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type RemiseType = 'PCT' | 'MONTANT';

type Props = {
  /** Valeur courante (peut être null = pas de remise). */
  value: number | null;
  type: RemiseType;
  onChange: (next: { value: number | null; type: RemiseType }) => void;
  /** ID HTML pour pairing avec un Label externe. */
  id?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  ariaLabel?: string;
};

/**
 * RemiseInput V1 — input numérique + toggle % / $.
 *
 * Pattern V1 partagé entre BDT (remise services + pièces) et facture.
 * Validation : pour `%`, value clampée [0, 100]. Pour `$`, value ≥ 0.
 *
 * Le toggle est un bouton dédié à droite de l'input (groupé visuellement).
 * La saisie vide → `value: null` (pas de remise).
 */
export function RemiseInput({
  value,
  type,
  onChange,
  id,
  disabled,
  size = 'md',
  className,
  ariaLabel,
}: Props) {
  const handleValue = (raw: string) => {
    if (raw === '') return onChange({ value: null, type });
    const n = Number(raw);
    if (Number.isNaN(n)) return;
    const clamped = type === 'PCT' ? Math.min(100, Math.max(0, n)) : Math.max(0, n);
    onChange({ value: clamped, type });
  };

  const handleType = (next: RemiseType) => {
    onChange({ value, type: next });
  };

  const heightCls = size === 'sm' ? 'h-8' : 'h-10';
  const padCls = size === 'sm' ? 'px-2.5 text-sm' : 'px-3.5 text-sm';

  return (
    <div
      className={cn(
        'inline-flex items-stretch overflow-hidden rounded-[var(--input-radius)] border-[1.5px] border-[var(--input-border)] bg-white transition-[border-color,box-shadow]',
        'focus-within:border-[var(--jaune)] focus-within:shadow-[0_0_0_3px_var(--input-focus-ring)]',
        disabled && 'opacity-60 cursor-not-allowed',
        heightCls,
        className,
      )}
    >
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        max={type === 'PCT' ? 100 : undefined}
        step={type === 'PCT' ? 0.5 : 0.01}
        value={value ?? ''}
        onChange={(e) => handleValue(e.target.value)}
        disabled={disabled}
        aria-label={ariaLabel ?? 'Remise'}
        className={cn(
          'min-w-0 flex-1 border-0 bg-transparent outline-none',
          'placeholder:text-[var(--text-secondary-50)]',
          padCls,
        )}
        placeholder="0"
      />
      <div
        role="radiogroup"
        aria-label="Type de remise"
        className="flex items-stretch border-l-[1.5px] border-[var(--input-border)]"
      >
        <ToggleBtn
          active={type === 'PCT'}
          disabled={disabled}
          onClick={() => handleType('PCT')}
          ariaLabel="Pourcentage"
        >
          %
        </ToggleBtn>
        <ToggleBtn
          active={type === 'MONTANT'}
          disabled={disabled}
          onClick={() => handleType('MONTANT')}
          ariaLabel="Montant"
        >
          $
        </ToggleBtn>
      </div>
    </div>
  );
}

function ToggleBtn({
  active,
  disabled,
  onClick,
  children,
  ariaLabel,
}: {
  active: boolean;
  disabled: boolean | undefined;
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-9 items-center justify-center text-sm font-semibold transition-colors',
        active
          ? 'bg-[var(--jaune)] text-black'
          : 'bg-transparent text-[var(--text-secondary-60)] hover:bg-black/5',
      )}
    >
      {children}
    </button>
  );
}
