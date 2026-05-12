# Pièges Vitest

> Gotchas rencontrés en écrivant les tests Phase 2 (PR #19).

## 1. `vi.mock` est hoisted, les variables référencées **non**

```ts
// ❌ ReferenceError: Cannot access 'calls' before initialization
const calls = { success: vi.fn() };
vi.mock('sonner', () => ({ toast: calls }));

// ✅ vi.hoisted partage la ref avec le mock hoisted
const calls = vi.hoisted(() => ({ success: vi.fn() }));
vi.mock('sonner', () => ({ toast: calls }));
import { toast } from './toast';  // après vi.mock
```

## 2. Fake timers + `waitFor` se bloquent mutuellement

`vi.useFakeTimers()` empêche les setTimeout réels (utilisés en interne par
`waitFor`) → timeout 5s du test.

```ts
// ❌ Bloque
vi.useFakeTimers();
await waitFor(() => expect(result.current.status).toBe('saved'));

// ✅ Switch en real timers juste pour la partie async
it('test', async () => {
  vi.useRealTimers();
  // ... le code qui dépend de setTimeout réel
  await waitFor(() => expect(...).toBe(...));
});
```

## 3. `@vitejs/plugin-react` est ESM-only, casse `vitest.config.ts` CJS

Pour transformer JSX sans plugin :

```ts
export default defineConfig({
  esbuild: { jsx: 'automatic' },   // ← simple, marche
  // PAS : plugins: [react()]  ← ESM error
});
```

## 4. happy-dom uniquement pour les tests qui en ont besoin

happy-dom prend ~150ms à init. Sur ~540 tests purs node, c'est 80s gâchées.
Solution : opt-in par suffix.

```ts
test: {
  environment: 'node',
  environmentMatchGlobs: [
    ['src/**/*.dom.test.{ts,tsx}', 'happy-dom'],
  ],
}
```

Convention : `xxx.dom.test.tsx` = test DOM. `xxx.test.ts` = test pur node.

## 5. Radix Dialog rend le titre dans 2 endroits

DialogTitle + un span pour `aria-labelledby`. Tester par `getByRole('button', { name })`
pas `queryByText(title)`.

## 6. React 19 useOptimistic exige `startTransition`

```ts
// ⚠ Warning React
const handle = () => {
  setOptimistic(newValue);
  saveAction();
};

// ✅
const handle = () => {
  startTransition(() => {
    setOptimistic(newValue);
  });
  saveAction();
};
```

## 7. `act()` warning sur Radix actions asynchrones

Le `dialog.click()` déclenche un setState asynchrone Radix. Wrapper dans
`act(() => { btn.click(); })` pour silencier le warning RTL.

## Liens

- [[Tests setup]]
- [[Patterns Phase 2]]
