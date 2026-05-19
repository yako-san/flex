'use client';

import * as React from 'react';
import { PillsToggle } from '@/components/ui/pills-toggle';

/**
 * Toggle thème dark/light. Bascule `body.classList.light-mode` et
 * persiste dans `localStorage['flex-theme']`. Initialisation côté
 * serveur via inline script dans `[locale]/layout.tsx`.
 *
 * Spec : `docs/design-system/preview/components-pills-toggle.html`
 * (variante `mini` + `data-theme`).
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

  return (
    <PillsToggle
      options={[
        { value: 'light', label: '☀', ariaLabel: 'Light' },
        { value: 'dark', label: '🌙', ariaLabel: 'Dark' },
      ]}
      value={value}
      onChange={(next) => {
        setValue(next);
        if (next === 'light') {
          document.body.classList.add('light-mode');
          localStorage.setItem('flex-theme', 'light');
        } else {
          document.body.classList.remove('light-mode');
          localStorage.setItem('flex-theme', 'dark');
        }
      }}
      size="mini"
      themeToggle
      aria-label="Thème"
    />
  );
}
