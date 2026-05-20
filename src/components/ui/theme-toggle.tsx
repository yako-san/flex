'use client';

import * as React from 'react';

/**
 * Toggle thème dark/light — port exact du standalone DS
 * (`docs/design-system/preview/tokens-editor.html` § theme-toggle).
 *
 * Pill mini 30px haute, fond `--overlay-layer`, 2 boutons SVG outline.
 * Bouton actif = `--jaune` avec icône noir.
 *
 * Persiste dans `localStorage['flex-theme']` ; initialisation côté
 * serveur via inline script dans `[locale]/layout.tsx`.
 */
export function ThemeToggle() {
  const [value, setValue] = React.useState<'dark' | 'light'>('dark');

  // Sync state initial depuis le body au mount (lit ce que le script
  // inline a déjà appliqué).
  React.useEffect(() => {
    if (document.body.classList.contains('light-mode')) {
      setValue('light');
    }
  }, []);

  function apply(next: 'dark' | 'light') {
    setValue(next);
    if (next === 'light') {
      document.body.classList.add('light-mode');
      localStorage.setItem('flex-theme', 'light');
    } else {
      document.body.classList.remove('light-mode');
      localStorage.setItem('flex-theme', 'dark');
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label="Thème"
      className="inline-grid auto-cols-fr grid-flow-col items-center rounded-full p-[5px]"
      style={{
        height: 30,
        background: 'var(--overlay-layer)',
        transition: 'background 220ms ease',
      }}
    >
      <ToggleBtn active={value === 'dark'} label="Sombre" onClick={() => apply('dark')}>
        <MoonIcon />
      </ToggleBtn>
      <ToggleBtn active={value === 'light'} label="Clair" onClick={() => apply('light')}>
        <SunIcon />
      </ToggleBtn>
    </div>
  );
}

function ToggleBtn({
  active, label, onClick, children,
}: { active: boolean; label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      aria-label={label}
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-full border-0"
      style={{
        width: 30,
        height: 20,
        background: active ? 'var(--jaune)' : 'transparent',
        color: active ? '#000' : 'currentColor',
        cursor: 'pointer',
        transition: 'color 220ms ease, background 220ms ease',
      }}
    >
      {children}
    </button>
  );
}

function MoonIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <circle cx={12} cy={12} r={4} />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}
