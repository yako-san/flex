---
description: Workflow pour porter une page V1.0.19 vers V2 — lit le PNG de référence puis code
allowed-tools: Read, Glob, Grep, Edit, Write, Bash(pnpm test:*), Bash(pnpm typecheck), Bash(ls docs/v1-reference/screenshots)
---

Tu vas porter (ou affiner) la page V1 vers V2 demandée : $ARGUMENTS

## Étape 1 — Référence visuelle obligatoire

**Avant d'écrire une seule ligne de code**, identifie le ou les PNG
correspondants dans `docs/v1-reference/screenshots/`. C'est la source
de vérité visuelle Sprint 4 β+. Les descriptions textuelles ne suffisent
JAMAIS — la densité, les couleurs de fond selon statut et les patterns
d'interaction se voient sur l'image.

```
ls docs/v1-reference/screenshots/
```

Lis le ou les PNG pertinents pour la page (ex: `2-ventes.png`,
`1-inventaire.png`, `1a-bon-de-travail-reçu-oui-rv.png`). Si plusieurs
captures existent pour la même page (état vide / rempli / menus), lis-les
toutes.

## Étape 2 — Audit des invariants Sprint 4 β+

Avant de coder, énonce explicitement :

- **Layout** : combien de colonnes ? Zones empilées ou côte à côte ?
- **Couleur de fond selon statut** : jaune RV/REÇU, vert clair
  ÉVAL/ON BENCH/APPROUVÉ, orange EN ATTENTE, rose pâle FACTURÉ.
  Jamais de gris neutre.
- **Tokens V1** : `--jaune` (#fff056), `--rouge`, `--st-*` (statuts),
  `--cmd-*` (commandes). Aucune couleur hardcodée.
- **Dropdowns customs** (fond noir, texte blanc, header coloré
  « ✓ Sélection → ») et PAS de `<select>` natif.
- **Confirms** : `customConfirm` (modal stylée V1), jamais `window.confirm`.
- **Toasts** : `sonner` via le wrapper `toast`, jamais `alert`.
- **Autosave debounced** sur les formulaires, pas de bouton Save.

## Étape 3 — Plan d'implémentation

Présente un plan en 3 à 6 étapes, files concernés, composants UI réutilisés
de `src/components/ui/`. Demande validation avant d'écrire.

## Étape 4 — Implémentation

- Tous textes user-facing en **français québécois** (fr-CA).
- Server Actions avec `useActionState` et returns d'erreur passés à `toast`.
- Soft-delete (`deletedAt`) respecté pour les listes.
- next-intl `localePrefix='always'` — les liens doivent inclure le locale.

## Étape 5 — Vérification

1. `pnpm typecheck` — doit passer.
2. `pnpm test` — pas de régression sur les 544 tests existants.
3. Si possible, lance `pnpm dev` (port 3001) et vérifie visuellement
   contre le PNG. Mentionne explicitement si tu n'as pas pu tester
   l'UI en navigateur.
