# useOptimisticPatch

> Wrapper React 19 `useOptimistic` pour les listes — update instantané au
> click, sync serveur en arrière-plan, rollback automatique si erreur.
> Source : `src/hooks/use-optimistic-patch.ts`.

## Signature

```ts
useOptimisticPatch<T>(
  initial: T[],
  saveAction: (key: OptimisticKey, updates: Partial<T>) => Promise<void>,
  options?: { errorMessage?: string | null; keyField?: string },
): { items: T[]; patch: (key, updates) => Promise<void>; pending: boolean }
```

- `errorMessage` : texte du toast d'erreur. `null` = silencieux.
- `keyField` : champ d'identité (défaut `'id'`, ex `'_row'` pour modèles V1).

## Caractéristiques

- **Update immédiat** via `useOptimistic` (React 19, dans `startTransition`).
- **Rollback auto** : si `saveAction` throw, React revert l'état (pas besoin
  de gérer manuellement).
- **Toast d'erreur** par défaut via [[toast helper]].
- **Pending state** : `pending: true` pendant le round-trip.

## Usage type

```tsx
const { items, patch, pending } = useOptimisticPatch(
  initialItems,
  async (id, updates) => fetch(`/api/items/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
);

return items.map((item) => (
  <button onClick={() => patch(item.id, { done: !item.done })} disabled={pending}>
    {item.done ? '✓' : '○'} {item.label}
  </button>
));
```

## Tests

`src/hooks/use-optimistic-patch.dom.test.tsx` (7 tests).

## Liens

- [[Patterns Phase 2]]
- [[toast helper]]
