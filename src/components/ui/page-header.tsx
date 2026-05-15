import * as React from 'react';
import { cn } from '@/lib/utils';

type Props = {
  /** Sur-titre gris en majuscules (ex: « vélos en atelier »). */
  eyebrow?: string;
  /** Titre H1 grand thin. */
  title: React.ReactNode;
  /** Hint/tooltip discret à droite du titre. */
  hint?: React.ReactNode;
  /** Sous-ligne (compteur, breadcrumb, contexte). */
  subline?: React.ReactNode;
  /** Zone droite : search + UtilButtons + AddButton, etc. */
  actions?: React.ReactNode;
  className?: string;
  /**
   * Sticky par défaut. `false` pour les headers de modale internes.
   */
  sticky?: boolean;
};

export function PageHeader({
  eyebrow,
  title,
  hint,
  subline,
  actions,
  className,
  sticky = true,
}: Props) {
  return (
    <header
      className={cn(
        'flex w-full items-end justify-between gap-4 border-b border-[rgba(0,0,0,0.15)] bg-[var(--gris-bg)] px-6 py-4',
        sticky && 'sticky top-0 z-30',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary-60)]">
            {eyebrow}
          </p>
        ) : null}
        <div className="flex items-baseline gap-3">
          <h1 className="truncate">{title}</h1>
          {hint ? <span className="text-sm text-[var(--text-secondary-50)]">{hint}</span> : null}
        </div>
        {subline ? (
          <div className="mt-1 text-sm text-[var(--text-secondary-60)]">{subline}</div>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
