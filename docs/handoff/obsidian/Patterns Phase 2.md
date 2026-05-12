# Patterns Phase 2 (Sprint 4 β+)

> Les 4 primitives ergonomiques ajoutées au Sprint 4 β+. Ce sont les blocs
> de base pour rendre V2 réactive et silencieuse comme V1.

## [[useDebouncedAutosave]]

Hook React qui save côté serveur après un délai de debounce (défaut 500ms).
Pas de bouton Save explicite — l'utilisateur tape, on save tout seul.

Expose un `status: 'idle' | 'saving' | 'saved' | 'error'` pour afficher
un indicateur discret (badge AutosaveStatus).

**Usage type** : WorkflowForm BDT (remises, avance, notes, evalStatus).

## [[useOptimisticPatch]]

Wrapper autour de React 19 `useOptimistic` pour les listes. Le rendu change
**instantanément** au click, puis sync serveur en arrière-plan. Si le save
échoue, toast d'erreur (rollback automatique par React).

**Usage type** : checkboxes BdtAdvancement, items cmdStatus pièce.

## [[toast helper]]

Wrapper sonner avec types `'success' | 'error' | 'info' | 'warning'`. Toaster
monté dans `src/app/[locale]/layout.tsx`. Style tokens V1 (jaune success,
rouge error).

```ts
import { toast } from '@/lib/utils/toast';
toast.success('Enregistré');
toast.error('Erreur lors de la sauvegarde');
toast('Note neutre');  // = info
```

## [[customConfirm]]

Dialog impératif stylé V1 — remplace `window.confirm`. Singleton publish/subscribe :
`<ConfirmDialogHost />` est monté une fois dans le layout, et `customConfirm(opts)`
retourne une `Promise<boolean>`.

```ts
const ok = await customConfirm({
  title: 'Supprimer ce vélo ?',
  message: 'Cette action est réversible.',
  confirmLabel: 'Supprimer',
  variant: 'danger',
});
if (ok) { /* delete */ }
```

## Composants Phase 2 (au-delà des primitives)

- [[ArchiveChoiceDialog v1.0.19]] — pattern un-clic 4-décisions
- `BDCTotaux` — pill noir + lien éditable « avance ? » inline
- `FactureStatusPanel` — pills toggle statut + mode paiement
- `BdtSidecard` — carte gauche unifiée colorée selon statut

## Liens

- [[Sprint 4 béta plus]]
- [[Tests setup]] — comment tester ces patterns
- [[Pièges Vitest]] — gotchas fake timers + mocks
