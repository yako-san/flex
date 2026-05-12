# Workflow git

## Branches

- **`main`** : seule branche pérenne. Protégée. Push direct refusé (HTTP 403).
- **`claude/*`** : branches de travail jetables, créées par les sessions
  Claude. Conventions :
  - `claude/sprint4-phase-3.X-nom` pour les phases Sprint 4
  - `claude/sprint2.8-*` pour les sprints non-UI
  - `claude/handoff-*` pour les docs
  - `claude/resume-*` historiques (à clean)

## Modèle de PR

1. Créer une branche depuis `main`
2. Coder + tester localement (`pnpm tsc --noEmit && pnpm test`)
3. Commit avec format `feat|fix|docs|refactor(scope): titre court` + body FR
4. Push `git push -u origin claude/...`
5. Créer PR vers `main` (via `mcp__github__create_pull_request`)
6. Attendre Vercel preview check vert
7. Si CI vert + 0 review comment → **merger** (yako-san l'autorise explicitement)

⚠ **Exception** : PR avec migration SQL en attente d'apply (cf [[Sprint 2.8 photos]])
— ne PAS merger sans confirmation que SQL est appliqué.

## Merge method

`merge` classique (pas `squash`) pour préserver l'historique des commits
granulaires phase par phase.

## Format commit

```
feat(sprint4/phase-3.2): refonte BDT detail en 3 colonnes V1

Body en français qui explique le pourquoi, pas le quoi (le diff montre
le quoi). Référence captures V1 si applicable.

Tests : 544 passent, type-check propre.

https://claude.ai/code/session_01HFAt6MeJ7AKtn1NrFsfzVz
```

Trailer Claude obligatoire (lien session).

## Format PR

Title : titre commit phase 1
Body : récap + test plan checkbox + lien session

## yako-san autorise le merge auto

Critères :
- CI Vercel preview check ✓
- 0 review comment non résolu
- Pas de SQL en attente

Sinon → demander avant merge.

## Git hooks (pas en place pour V2)

V2 n'a pas de pre-commit/pre-push hook. CI Vercel valide build à la push.
`pnpm test` et `pnpm tsc` sont à lancer manuellement avant commit (pratique
appliquée systématiquement par les sessions Claude).

## Branches locales accumulées

Les sessions Claude créent une branche par phase et la mergent via PR. Une
fois mergée la branche est officiellement morte mais elle reste localement
chez Claude jusqu'au prochain `git fetch --prune` ou nettoyage manuel.

À nettoyer périodiquement avec :

```bash
git branch --merged main | grep -E "^\s+claude/" | xargs -r git branch -d
```

(À NE PAS faire sans confirmation, c'est destructif.)

## Liens

- [[Vercel et Neon]]
- [[Sprint 4 béta plus]]
