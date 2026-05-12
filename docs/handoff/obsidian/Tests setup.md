# Tests setup

> Vitest 2.1, 573 tests (+29 ajoutés Sprint 4 PR #19). 16 skipped.

## Config

`vitest.config.ts` :

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  // JSX automatique React 19 SANS plugin (plugin-react est ESM-only et
  // casse vitest.config.ts en CJS — cf [[Pièges Vitest]])
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'node',
    // happy-dom OPTIN par suffix de fichier `*.dom.test.{ts,tsx}`
    // → évite le coût happy-dom sur les ~540 tests purs
    environmentMatchGlobs: [
      ['src/**/*.dom.test.{ts,tsx}', 'happy-dom'],
    ],
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
});
```

## Convention

- `xxx.test.ts` — test pur node (lib utils, normalize, parse, …)
- `xxx.dom.test.tsx` — test qui touche au DOM (hooks React, components)

Setup tools : `happy-dom`, `@testing-library/react`, `@testing-library/dom`.

## Lancer

```bash
pnpm test                                # run all
pnpm vitest run src/lib/utils/toast      # par chemin
pnpm vitest                              # watch mode
```

## Patterns

### Mocker un module avec `vi.hoisted`

```ts
const calls = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast: calls }));
import { toast } from './toast';  // AFTER vi.mock
```

Sans `vi.hoisted` : ReferenceError parce que `vi.mock` est hoisted en haut
mais pas les déclarations let/const.

### Tester un hook avec `renderHook`

```ts
import { act, renderHook, waitFor } from '@testing-library/react';

const { result, rerender } = renderHook(({ value }) => useFoo(value), {
  initialProps: { value: 'a' },
});

rerender({ value: 'b' });
await waitFor(() => expect(result.current.status).toBe('saved'));
```

### Fake timers : pas mélanger avec `waitFor`

`vi.useFakeTimers()` bloque les setTimeout réels que `waitFor` utilise en
interne → timeout 5s du test. Switch en real timers pour les bouts
asynchrones, ou advance manuellement avec `vi.advanceTimersByTime(N)`.

### Tester un dialog Radix

Radix rend le titre dans 2 endroits (DialogTitle + aria-labelledby span).
Préférer `getByRole('button', { name: /label/i })` pour cibler l'action
précisément, pas `queryByText(title)`.

## Couverture

Pas configurée par défaut. Pour générer un report :

```bash
pnpm vitest run --coverage
```

(Provider `v8`, exclude `*.test.ts` et `*.d.ts`.)

## Liens

- [[Pièges Vitest]]
- [[Patterns Phase 2]] — les hooks que ces tests couvrent
