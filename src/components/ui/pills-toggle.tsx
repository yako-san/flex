'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type PillsToggleOption<T extends string> = {
  value: T;
  label: React.ReactNode;
  ariaLabel?: string;
};

type Props<T extends string> = {
  options: PillsToggleOption<T>[];
  value: T;
  onChange: (next: T) => void;
  className?: string;
  size?: 'sm' | 'md';
  'aria-label'?: string;
};

/**
 * Tabs pilule V1 — pattern récurrent (CLIENT/VÉLO sur fiche BDT,
 * Éval/Facture sur note client, Comptant/Interac/Cartes sur facture, etc.).
 * Comportement clavier ARIA (←/→/Home/End) géré nativement via radio group.
 */
export function PillsToggle<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'md',
  'aria-label': ariaLabel,
}: Props<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-[var(--overlay-dark-20)] p-1',
        className,
      )}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={opt.ariaLabel}
            onClick={() => onChange(opt.value)}
            className={cn(
              'rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--jaune)]',
              size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm',
              selected
                ? 'bg-[var(--jaune)] text-black shadow-sm'
                : 'bg-transparent text-white/85 hover:bg-white/10',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
