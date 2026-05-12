# toast helper

> Wrapper sonner avec types `success | error | info | warning`.
> Source : `src/lib/utils/toast.ts`.

## Setup

`<Toaster />` (sonner stylé V1) monté dans `src/app/[locale]/layout.tsx`.
Position top-right, auto-dismiss 3.5s.

## Style V1

| Type | bg | fg |
|---|---|---|
| success | `--jaune` (jaune signature) | noir |
| error | `--rouge` | blanc |
| warning | `#fb923c` (orange EN_ATTENTE) | noir |
| info | noir 85% | blanc |

## Usage

```ts
import { toast } from '@/lib/utils/toast';

toast('Note neutre');               // info
toast.success('Enregistré');
toast.error('Erreur du serveur');
toast.warning('Stock bas');
toast('Avec type explicite', 'success');
```

## Pattern : feedback après Server Action

```ts
const r = await saveAction(...);
if (r.error) toast(r.error, 'error');
else toast('Sauvegardé', 'success');
```

Remplace systématiquement `window.alert()`. Audit final Sprint 4 β+ : aucun
`window.alert` ou `confirm` dans `src/app/[locale]/admin`.

## Tests

`src/lib/utils/toast.test.ts` (9 tests, sonner mocké via `vi.hoisted`).

## Liens

- [[Patterns Phase 2]]
- [[customConfirm]] — pour les confirms (alternative à `window.confirm`)
