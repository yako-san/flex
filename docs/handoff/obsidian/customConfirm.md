# customConfirm

> Dialog impératif stylé V1, alternative à `window.confirm`. Singleton
> publish/subscribe. Source : `src/components/ui/confirm-dialog.tsx`.

## Setup

`<ConfirmDialogHost />` monté **une seule fois** dans `src/app/[locale]/layout.tsx`
(avec `<Toaster />`). Tout `customConfirm(opts)` réveille ce host via un
publish/subscribe singleton.

## Signature

```ts
customConfirm({
  title: string,
  message?: string,
  confirmLabel?: string,    // défaut 'Confirmer'
  cancelLabel?: string,     // défaut 'Annuler'
  variant?: 'default' | 'danger',
}): Promise<boolean>
```

Résout `true` si l'utilisateur clique Confirmer, `false` sinon (clic outside,
Escape, X, ou Annuler).

## Usage

```ts
const ok = await customConfirm({
  title: 'Supprimer ce vélo ?',
  message: 'Action réversible (soft delete) — restaurable via Maintenance.',
  confirmLabel: 'Supprimer',
  variant: 'danger',
});
if (ok) await deleteAction(id);
```

## Pattern destructif

```ts
const handleDelete = async () => {
  const ok = await customConfirm({
    title: `Supprimer ${name} ?`,
    message: '...',
    variant: 'danger',
  });
  if (!ok) return;
  startTransition(async () => {
    const r = await deleteAction(id);
    if (r.error) toast(r.error, 'error');
    else { toast('Supprimé', 'success'); router.refresh(); }
  });
};
```

## Limitation

Le singleton ne supporte qu'un confirm à la fois (par design — on n'empile
pas des modals destructives).

## Tests

`src/components/ui/confirm-dialog.dom.test.tsx` (5 tests).

## Liens

- [[Patterns Phase 2]]
- [[toast helper]]
- [[ArchiveChoiceDialog v1.0.19]] — pattern différent (4 boutons + 1 cancel)
