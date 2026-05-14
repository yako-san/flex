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

## ⚠ Alerte config Vercel découverte 2026-05-13

**Vercel n'a pas `main` configurée comme Production Branch.** Tous les
merges sur `main` (Sprint 4 β+, photos Sprint 2.8, mon cron purge, etc.)
ont été déployés en **Preview** seulement, jamais promus en Production.
Production Current sert un vieux Redeploy de la veille.

**Fix en 2 étapes** (à faire avant toute autre action) :

1. https://vercel.com/yako-sans-projects/flex/settings/git → **Production Branch** = `main` → Save
2. `npx vercel promote https://flex-an6eb94a3-yako-sans-projects.vercel.app --scope=yako-sans-projects`
3. Vérif : `curl -i https://flex-tan.vercel.app/api/cron/purge-photos` doit renvoyer `HTTP/2 401` (route déployée).

Aucune perte de données (DB Neon `flex-prod` jamais touchée par la session)
mais les claims « livré en prod » du Sprint 4 β+ sont **techniquement
faux** tant que la promotion n'est pas faite.

## État actuel (mise à jour 2026-05-12 fin de session)

**26 PRs mergées sur main dans la session 2026-05-12.** Toutes ces livraisons
sont en prod sur `flex-tan.vercel.app` (Vercel suit `main`).

### Récap session 2026-05-12

| Domaine | PRs |
|---|---|
| Sprint 4 β+ (Phases 0/1/2/3.x/4.a-4.f) | #9-#17 |
| Tests hooks Phase 2 (+29 tests) | #19 |
| Handoff docs (primer + memory + hindsight + vault Obsidian) | #20 |
| WorkflowForm en 3 fragments (Remises/Avance/Notes) avec autosave ciblé | #21 |
| **Sprint 2.8 photos Vercel Blob** (model + lib + UI) | #18, #22 |
| Sprint 2.7 polish Gmail draft hybride | #18 |
| Polish responsive (admin layout + tables overflow-x mobile) | #23 |
| A11y aria-label sur boutons icon-only | #24 |
| **Sidebar V1 jaune** intégrée au admin layout (icônes Lucide, hover-expand) | #25 |
| Tests `validatePhotoUpload` (+17 tests) | #26 |

**Tests Vitest** : 590 passants (16 skipped). type-check propre.

### Reste à faire (hors scope Sprint 4 β+ et 2.8)

| Item | Statut |
|---|---|
| Vraies pages tuto `/admin/aide/01-recevoir-velo` etc. | 11 cards avec blurbs courts — pas de pages détaillées. Risque d'invention sans validation user. |
| Audit Lighthouse / axe-core 90+ | Besoin Chrome + serveur tournant (Vercel preview). À faire manuellement. |
| Tests Server Actions Sprint 2.8 photos (upload/delete/reorder) | Couverture incomplète. Demande mock Prisma + Vercel Blob. |
| Refonte sidebar mobile en drawer | Actuellement nav horizontale scrollable < md, pourrait être un drawer hamburger plus ergonomique. |
| i18n EN-CA des chaînes Sprint 4 | Beaucoup de FR hardcodées (eyebrows, sublines, labels). À externaliser si scale autres ateliers. |
| Refonte BdtSidecard mobile | Sur mobile actuellement, la carte gauche prend full-width puis les blocs Services/Pièces stack. À tester sur viewport iPhone. |
| ~~Job purge périodique Vercel Blob~~ | ✅ Livré (session 2026-05-12 suite). Cron `/api/cron/purge-photos` (`vercel.json` schedule `0 3 * * *`) appelle `purgeOrphanPhotos` qui supprime Blob + row pour `deletedAt > 30 jours`. Protégé par `CRON_SECRET` (à configurer côté Vercel). 11 tests sur `purge.ts`. |

### Branches `claude/*` côté GitHub (à nettoyer)

Plusieurs branches `claude/sprint4-*` et `claude/sprint2.8-*` mergées via PR
restent listées dans GitHub. Nettoyer via https://github.com/yako-san/flex/branches
filtre « Merged » → bulk delete.

À PRÉSERVER (historiques préservées en local) :
- `claude/bootstrap-flex-app-v2-0Gwel`
- `claude/resume-flex-v2-0DctE`
- `claude/sprint4-phase3-inventaire`

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
