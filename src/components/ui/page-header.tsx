import * as React from 'react';
import { cn } from '@/lib/utils';

type Props = {
  /**
   * Eyebrow lowercase au-dessus du titre. Rendu dans une plaque grise
   * séparée (#929292, padding 10pt, radius 6px) — pattern `text-bg par
   * ligne` du DS (`docs/design-system/preview/components-page-header.html`).
   */
  eyebrow?: React.ReactNode;
  /** Titre H1 jaune thin V1 — clamp(32px, 7vw, 50px). */
  title: React.ReactNode;
  /**
   * Pastille help `?` ronde jaune 18px à côté du titre. Si une string
   * est fournie, elle devient le `title` (tooltip) du `?`. Si `true`,
   * pastille sans tooltip. Sinon, pas de pastille.
   */
  help?: boolean | string;
  /**
   * Sous-ligne (compteur, breadcrumb, contexte). Rendue dans sa propre
   * plaque grise sous le titre.
   */
  subline?: React.ReactNode;
  /** Zone droite : ToolbarBlock + boutons + search. */
  actions?: React.ReactNode;
  className?: string;
  /** Sticky par défaut. `false` pour les headers de modale internes. */
  sticky?: boolean;
};

/**
 * Header de page admin V2 — pattern `text-bg par ligne`.
 *
 * Spec figée par `docs/design-system/preview/components-page-header.html` :
 * chaque ligne (eyebrow / title-row / subline) porte sa propre plaque
 * `#929292` `padding: 10pt` `border-radius: 6px`, empilées avec un
 * léger overlap vertical de -4px. Le H1 utilise des marges négatives
 * pour trimmer le descender slack de Helvetica afin que le padding
 * optique soit homogène 10pt sur les 4 côtés.
 *
 * La pastille `?` help à droite du H1 est un cercle jaune 18px (texte
 * noir 11pt 700) décalé de -5pt par rapport au baseline du H1 — c'est
 * la pastille « aide contextuelle » V1.
 */
export function PageHeader({
  eyebrow,
  title,
  help,
  subline,
  actions,
  className,
  sticky = true,
}: Props) {
  const helpTitle = typeof help === 'string' ? help : undefined;
  const showHelp = help !== undefined && help !== false;

  return (
    <header
      className={cn(
        'flex w-full items-end justify-between gap-6 px-6 py-5',
        sticky && 'sticky top-0 z-30',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col items-start gap-0">
        {eyebrow ? (
          <span
            className="inline-block rounded-md text-[13px] font-bold leading-none text-white"
            style={{
              background: 'var(--app-bg)',
              padding: 10,
              textTransform: 'lowercase',
              marginBottom: -4,
            }}
          >
            {eyebrow}
          </span>
        ) : null}
        <div
          className="inline-flex items-start rounded-md"
          style={{
            background: 'var(--app-bg)',
            padding: 10,
            marginBottom: subline ? -4 : 0,
          }}
        >
          <h1
            className="truncate"
            style={{
              color: 'var(--jaune)',
              fontWeight: 300,
              fontSize: 'clamp(32px, 7vw, 50px)',
              lineHeight: 1,
              // Trim Helvetica's descender slack pour que le padding
              // optique matche le 10pt déclaré (cf. spec preview).
              marginTop: -6,
              marginBottom: -10,
              paddingRight: showHelp ? 8 : 0,
            }}
          >
            {title}
          </h1>
          {showHelp ? (
            <span
              className="inline-flex shrink-0 cursor-help items-center justify-center rounded-full font-bold leading-none"
              style={{
                width: 18,
                height: 18,
                background: 'var(--jaune)',
                color: '#000',
                fontSize: 11,
                marginTop: -5,
              }}
              title={helpTitle}
              role="img"
              aria-label={helpTitle ?? 'Aide'}
            >
              ?
            </span>
          ) : null}
        </div>
        {subline ? (
          <span
            className="inline-block rounded-md text-[13px] leading-none"
            style={{
              background: 'var(--app-bg)',
              padding: 10,
              color: 'rgba(255,255,255,0.75)',
            }}
          >
            {subline}
          </span>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
