# PRIMER — démarrage rapide session flex-app V2

> **5-10 min de lecture.** Pour entrer dans le projet sans tout relire.

## Qu'est-ce que c'est

**flex-app V2** : SaaS multi-tenant de gestion d'atelier de vélo. Port de la V1
(`yako-san/flex-rev-app`, Next.js 14 + Google Sheets API) vers une stack
moderne Postgres-first.

- **Tenant principal** : yako-cyclo (Québec, fr-CA, CAD).
- **Prod** : <https://flex-tan.vercel.app> (suit la branche `main`).

## Stack

- Next.js 15.1 (App Router, typedRoutes) + React 19 + TypeScript strict
- Tailwind CSS v4 (CSS-first) + shadcn/ui (Radix) + tokens V1 (`--jaune`, `--st-*`, etc.)
- Lucide React (icônes — pas Heroicons)
- Prisma 5.22 + Postgres Neon (25+ modèles)
- next-intl 3.26 (fr-CA / en-CA, `localePrefix='always'`)
- Clerk 6.12 + Organizations (multi-tenant)
- Vitest 2.1 (573 tests, dont `*.dom.test.tsx` en happy-dom)
- `@vercel/blob` (Sprint 2.8, photos BDT)
- Sonner (toasts)
- Pino (logging)

## Langue et préférences

- **Tout en français** (Québec). Pas de validation émotionnelle.
- **Valider la cause avant la solution** : pas d'action sur hypothèse.
- **Push auto sur branche de travail** : commit + push direct sans redemander, sauf opérations destructives (force-push, reset, delete branch, drop table) → demander d'abord.
- **Branche pérenne** : `main` seule. PR obligatoire (push direct refusé).
- **JAMAIS** toucher la prod pendant les tests — seed la DB de dev.

## Référence visuelle V1 (Sprint 4 β+)

28 captures V1.0.19 dans [`docs/v1-reference/screenshots/`](../v1-reference/screenshots/).
Source : repo public miroir `yako-san/flex-handoff-public`. **Avant de coder
une refonte de page, consulte le PNG correspondant.**

⚠ Découverte critique : le **layout BDT detail** est **3 colonnes** (pas 4 zones
verticales empilées comme initialement décrit). Voir `1b-bon-de-travail-éval.png`.

## État actuel (sessions précédentes)

Sprint 4 β+ « port look + structure + flow V1.0.19 vers V2 » est **livré
intégralement**. Voir `CLAUDE.md` section « État Sprint 4 β+ » pour le récap
détaillé phase par phase (PR #6 à #19 mergées, +29 tests).

### Reste à faire (hors scope Sprint 4 β+)

| Item | Statut |
|---|---|
| Sprint 2.8 photos Vercel Blob | PR #18 ouverte — **en attente application SQL** sur Neon `flex-prod` / `main` (cf `prisma/migrations/20260512170000_bdc_photo/migration.sql`) |
| Sprint 2.7 Gmail draft hybride | Déjà implémenté (toggle dans `EmailButtons`). Polish visuel inclus dans PR #18. |
| Photos UI (upload + gallery) | Bloqué jusqu'à apply SQL Sprint 2.8 |
| Vraies pages tuto `/admin/aide` | 11 cards avec blurbs courts — pas de pages détaillées |
| Polish responsive complet | Audit tablette/iPhone à faire, Lighthouse 90+ |
| Refonte `WorkflowForm` en fragments | Mega form unique avec autosave global — pourrait être éclaté |
| i18n des chaînes Sprint 4 | Beaucoup de FR hard-coded, à externaliser si scale autres ateliers EN |

## Si pas de tâche explicite : autopilote

yako-san a explicitement demandé que les sessions repartent en autopilote sur
le projet en cours sans attendre l'instruction. Ordre suggéré :

1. Si Sprint 2.8 SQL appliqué → continuer Server Actions + UI photos
2. Sinon → polish responsive ou refonte WorkflowForm fragments
3. Si tout fini → audit accessibilité (focus-visible, ARIA, contrast Lighthouse)

## Commandes utiles

```bash
# État rapide de la session
./docs/handoff/memory.sh

# Tests
pnpm test                    # 573 passants
pnpm tsc --noEmit            # type-check

# Dev local (port 3001 vu que V1 occupe 3000)
pnpm dev

# Migrations Prisma — DANGER, jamais en prod sans coordination
# La vraie prod Neon = projet `flex-prod` branche `main`
# (pas `flex-v2/production` qui est dev/test)
pnpm prisma migrate dev
```

## Base de données — IMPORTANT

- **`flex-prod`** projet Neon, branche `main` = la VRAIE prod, branchée Vercel
- **`flex-v2`** projet Neon, branche `production` = dev/test (ne PAS migrer ici)
- Toutes les migrations SQL vont sur `flex-prod` / `main`
- `DATABASE_URL` Vercel gérée par l'intégration Vercel-Neon (read-only côté Vercel UI)

## Lectures dans cet ordre si tu redémarres une session

1. Ce `primer.md`
2. [`CLAUDE.md`](../../CLAUDE.md) — instructions projet complètes
3. [`docs/handoff/hindsight.md`](hindsight.md) — leçons apprises (pièges déjà rencontrés)
4. [`docs/handoff/obsidian/`](obsidian/) — notes interconnectées sur les concepts clés
5. [`docs/v1-reference/screenshots/README.md`](../v1-reference/screenshots/README.md) — index visuel V1
6. Exécute [`./docs/handoff/memory.sh`](memory.sh) pour l'état git/PR live
