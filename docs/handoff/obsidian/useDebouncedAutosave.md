# useDebouncedAutosave

> Hook React qui save côté serveur après un délai de debounce (défaut 500ms).
> Source : `src/hooks/use-debounced-autosave.ts`.

## Signature

```ts
useDebouncedAutosave<T>(
  value: T,
  save: (v: T) => Promise<void>,
  options?: { delay?: number; enabled?: boolean; savedDuration?: number },
): { status: AutosaveStatus; error: unknown; flush: () => Promise<void> }
```

`status` cycle : `idle → saving → saved → idle` (auto-reset après `savedDuration`
ms, défaut 1500). Sur erreur : `error` (et `error` field rempli).

## Caractéristiques

- **Skip initial render** : ne save pas au mount (sinon round-trip inutile).
- **Reset timer au change** : tape vite → débouncé.
- **Cleanup au unmount** : annule le timer, pas de save fantôme après navigate-away.
- **`flush()`** : force le save immédiatement, utile au beforeunload.

## Usage type

```tsx
function MyForm({ initialValue, save }) {
  const [value, setValue] = useState(initialValue);
  const { status } = useDebouncedAutosave(value, save);
  return (
    <>
      <input value={value} onChange={(e) => setValue(e.target.value)} />
      <AutosaveBadge status={status} />
    </>
  );
}
```

## Tests

`src/hooks/use-debounced-autosave.dom.test.tsx` (8 tests). Voir [[Tests setup]]
section fake timers + waitFor mélange.

## Liens

- [[Patterns Phase 2]]
