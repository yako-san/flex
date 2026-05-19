'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type PillsToggleOption<T extends string> = {
  value: T;
  label: React.ReactNode;
  ariaLabel?: string;
};

type Size = 'sm' | 'md' | 'mini';

type Props<T extends string> = {
  options: PillsToggleOption<T>[];
  value: T;
  onChange: (next: T) => void;
  className?: string;
  size?: Size;
  /**
   * Si true, le composant bascule `body.classList.toggle('light-mode')`
   * à chaque clic. Utilisé par le switch de thème global.
   */
  themeToggle?: boolean;
  'aria-label'?: string;
};

const TIMING = 'cubic-bezier(0.22, 1, 0.36, 1)';

/**
 * Tabs pilule V1 — pattern récurrent (CLIENT/VÉLO sur fiche BDT,
 * Éval/Facture sur note client, Comptant/Interac/Cartes sur facture,
 * Light/Dark sur switch thème).
 *
 * Spec figée par `docs/design-system/preview/components-pills-toggle.html` :
 * - Container `display: inline-grid; grid-auto-columns: 1fr` → toutes
 *   les colonnes égales (largeur = max-content du plus large bouton +
 *   10pt padding chaque côté).
 * - Indicateur jaune absolument positionné, animé en `translateX` +
 *   `width` mesurés via `getBoundingClientRect`. Transition 320ms
 *   cubic-bezier(0.22, 1, 0.36, 1).
 * - `md` : container 60pt, pad 10pt, button 40pt, font 13pt.
 * - `mini` : container 30pt, pad 5pt, button 20pt, font 11pt.
 * - `sm` : intermédiaire (compat back).
 * - `themeToggle` : bascule `body.light-mode` au clic.
 *
 * Comportement ARIA radio group : ←/→/Home/End gérés nativement.
 */
export function PillsToggle<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'md',
  themeToggle = false,
  'aria-label': ariaLabel,
}: Props<T>) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const buttonsRef = React.useRef<Map<T, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = React.useState<{ x: number; w: number } | null>(null);

  const syncIndicator = React.useCallback(() => {
    const root = rootRef.current;
    const active = buttonsRef.current.get(value);
    if (!root || !active) {
      setIndicator(null);
      return;
    }
    const rRoot = root.getBoundingClientRect();
    const rBtn = active.getBoundingClientRect();
    setIndicator({ x: rBtn.left - rRoot.left, w: rBtn.width });
  }, [value]);

  // Re-sync sur changement de value, mount et resize.
  React.useLayoutEffect(() => {
    syncIndicator();
  }, [syncIndicator, options]);

  React.useEffect(() => {
    const onResize = () => syncIndicator();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [syncIndicator]);

  // Padding/heights par size (spec preview).
  const pad = size === 'mini' ? 5 : size === 'sm' ? 6 : 10;
  const containerHeight = size === 'mini' ? 30 : size === 'sm' ? 38 : 60;
  const buttonHeight = size === 'mini' ? 20 : size === 'sm' ? 26 : 40;
  const fontSize = size === 'mini' ? 11 : size === 'sm' ? 12 : 13;

  return (
    <div
      ref={rootRef}
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        'relative isolate inline-grid items-center rounded-full',
        // Background dark mode (par défaut) — voir body.light-mode pour
        // l'inversion. PR thème (#8) propagera la version light.
        'bg-[var(--overlay-dark-20)]',
        className,
      )}
      style={{
        gridAutoFlow: 'column',
        gridAutoColumns: '1fr',
        height: containerHeight,
        padding: pad,
      }}
    >
      {/* Indicator jaune animé */}
      {indicator ? (
        <span
          aria-hidden
          className="pointer-events-none absolute rounded-full bg-[var(--jaune)] shadow-sm"
          style={{
            top: pad,
            bottom: pad,
            transform: `translateX(${indicator.x - pad}px)`,
            width: indicator.w,
            transition: `transform 320ms ${TIMING}, width 320ms ${TIMING}`,
            zIndex: 0,
            willChange: 'transform, width',
          }}
        />
      ) : null}

      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              if (el) buttonsRef.current.set(opt.value, el);
              else buttonsRef.current.delete(opt.value);
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={opt.ariaLabel}
            onClick={() => {
              onChange(opt.value);
              if (themeToggle) {
                const lbl = (opt.ariaLabel ?? '').toLowerCase();
                if (lbl === 'light' || lbl === 'clair') {
                  document.body.classList.add('light-mode');
                } else {
                  document.body.classList.remove('light-mode');
                }
              }
            }}
            className={cn(
              'relative z-[1] inline-flex items-center justify-center gap-1.5 rounded-full border-0 bg-transparent leading-none transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--jaune)]',
              selected
                ? 'font-semibold text-black'
                : 'text-white/85 hover:text-white',
            )}
            style={{
              height: buttonHeight,
              padding: `0 ${pad}px`,
              fontSize,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
