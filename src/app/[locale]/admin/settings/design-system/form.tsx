'use client';

import * as React from 'react';
import { useActionState } from 'react';
import type { WorkshopTheme } from '@/lib/theme/types';
import {
  saveDesignSystemAction,
  resetDesignSystemAction,
  type ThemeState,
} from './actions';

type Defaults = Record<string, string>;

type Props = {
  defaults: Defaults;
  current: WorkshopTheme;
};

const SIZE_KEYS = new Set(['h1-size', 'h2-size', 'h3-size', 'h4-size', 'h5-size']);

const SECTIONS: Array<{ title: string; rows: Array<{ key: keyof WorkshopTheme; label: string; hint?: string }> }> = [
  {
    title: 'Couleurs de base',
    rows: [
      { key: 'jaune',        label: 'Couleur highlight (jaune)', hint: 'Signature FLEX — sidebar, h1, accents.' },
      { key: 'app-bg',       label: 'Background (dark mode)',     hint: 'Gris système, fond global de l’admin shell.' },
      { key: 'app-bg-light', label: 'Background (light mode)',    hint: 'Override de --app-bg quand body.light-mode est ON.' },
    ],
  },
  {
    title: 'Typographie',
    rows: [
      { key: 'h1-size', label: 'H1 — taille' }, { key: 'h1-color', label: 'H1 — couleur' },
      { key: 'h2-size', label: 'H2 — taille' }, { key: 'h2-color', label: 'H2 — couleur' },
      { key: 'h3-size', label: 'H3 — taille' }, { key: 'h3-color', label: 'H3 — couleur' },
      { key: 'h4-size', label: 'H4 — taille' }, { key: 'h4-color', label: 'H4 — couleur' },
      { key: 'h5-size', label: 'H5 — taille' }, { key: 'h5-color', label: 'H5 — couleur' },
    ],
  },
];

export function DesignSystemForm({ defaults, current }: Props) {
  const [state, formAction, pending] = useActionState<ThemeState | null, FormData>(
    saveDesignSystemAction,
    null,
  );
  const [resetPending, startReset] = React.useTransition();

  return (
    <form action={formAction} className="space-y-6">
      {SECTIONS.map((section) => (
        <fieldset key={section.title} className="rounded-2xl border border-[var(--gris-bord)] bg-white/85 p-4">
          <legend className="px-2 text-sm font-semibold uppercase tracking-wider text-[var(--dark)]">
            {section.title}
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {section.rows.map((row) => {
              const placeholder = defaults[row.key as string] ?? '';
              const value = current[row.key];
              const isSize = SIZE_KEYS.has(row.key as string);
              return (
                <label key={row.key as string} className="flex flex-col gap-1 text-xs">
                  <span className="font-semibold text-[var(--dark)]">{row.label}</span>
                  {row.hint ? (
                    <span className="text-[11px] text-[var(--text-secondary-60)]">{row.hint}</span>
                  ) : null}
                  <div className="flex items-center gap-2">
                    {!isSize ? (
                      <input
                        type="color"
                        defaultValue={value ?? placeholder}
                        aria-label={`${row.label} (sélecteur)`}
                        onChange={(e) => {
                          const text = e.currentTarget
                            .closest('div')
                            ?.querySelector<HTMLInputElement>('input[type="text"]');
                          if (text) text.value = e.currentTarget.value;
                        }}
                        className="h-9 w-12 cursor-pointer rounded border border-[var(--gris-bord)]"
                      />
                    ) : null}
                    <input
                      type="text"
                      name={row.key as string}
                      defaultValue={value ?? ''}
                      placeholder={placeholder}
                      className="flex-1 rounded-md border border-[var(--gris-bord)] px-2 py-1.5 font-mono text-xs"
                    />
                  </div>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={resetPending}
          onClick={() => {
            if (!confirm('Réinitialiser tous les tokens éditables aux défauts ?')) return;
            startReset(async () => {
              await resetDesignSystemAction();
              window.location.reload();
            });
          }}
          className="btn-secondary"
          style={{ height: 36, padding: '0 14px', fontSize: 12 }}
        >
          ↺ Réinitialiser
        </button>
        <div className="flex items-center gap-3">
          {state?.error ? (
            <span className="text-xs text-[var(--rouge)]">{state.error}</span>
          ) : null}
          {state?.success ? (
            <span className="text-xs text-[var(--st-on-bench-fg)]">✓ Enregistré</span>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="btn-primary"
            style={{ height: 36, padding: '0 18px', fontSize: 13 }}
          >
            {pending ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </form>
  );
}
