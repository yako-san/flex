import * as React from 'react';
import { cn } from '@/lib/utils';

type Props = {
  /** Sur-titre blanc en gras (ex: « vélos en atelier »). */
  eyebrow?: string;
  /** Titre H1 jaune thin V1 — clamp(32px, 7vw, 50px). */
  title: React.ReactNode;
  /** Hint/tooltip discret à droite du titre. */
  hint?: React.ReactNode;
  /** Sous-ligne (compteur, breadcrumb, contexte). */
  subline?: React.ReactNode;
  /** Zone droite : ToolbarBlock + boutons + search. */
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
          // V1 : eyebrow = "slug" italique pâle (pas uppercase tracking),
          // affiché juste au-dessus du titre. Donne un ton "sous-titre éditorial"
          // au lieu du tag CAPS technique V2 historique.
          <p className="mb-0.5 text-sm italic" style={{ color: 'rgba(255,255,255,0.65)' }}>
            {eyebrow}
          </p>
        ) : null}
        <div className="flex items-baseline gap-3">
          <h1
            className="truncate"
            style={{
              color: '#fff056',
              fontWeight: 300,
              fontSize: 'clamp(32px, 7vw, 50px)',
              lineHeight: 1,
            }}
          >
            {title}
          </h1>
          {hint ? <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{hint}</span> : null}
        </div>
        {subline ? (
          <div className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{subline}</div>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
