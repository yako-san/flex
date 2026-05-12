# CLAUDE.md — flex-app v2

## Langue de travail

**TOUT EST EN FRANÇAIS.** Chaque réponse, commentaire, message de commit,
description de PR, et nom de variable user-facing doit être en français
(québécois). Les noms techniques de symboles peuvent rester en anglais
(ex: `userId`, `createdAt`) puisque ce sont des conventions du framework.

L'utilisateur (yako-san) est francophone (fr-CA) et a demandé explicitement
plusieurs fois de rester en français. Ne pas dériver vers l'anglais.

## Préférences transversales (à respecter strictement)

- **Pas de validation émotionnelle** : éviter "t'as raison", "excellente
  question", "super idée". Aller direct au fait.
- **Valider la cause avant la solution** : pas d'action sur hypothèse.
  Quand un truc casse, comprendre pourquoi avant de patcher.
- **Push auto sur la branche de travail accepté** : commit + push direct
  sans redemander, sauf opérations destructives (force-push, reset,
  delete branch, drop table). Pour celles-là, demander d'abord.
- **Bump auto APP_VERSION** quand l'utilisateur mentionne un numéro de
  version. Pas de mécanisme APP_VERSION en V2 pour l'instant — à mettre
  en place quand pertinent.
- **Préparer blob de reprise détaillé** avant compaction de session
  (résumé sur disque, pas juste en mémoire).
- **Ne JAMAIS toucher la prod pendant les tests** — toujours seed DB de
  dev.

## Référence visuelle V1 (Sprint 4 β+)

**28 captures V1.0.19** versionnées dans
[`docs/v1-reference/screenshots/`](docs/v1-reference/screenshots/) — source de
vérité visuelle pour la refonte UI V2.

**Avant de coder une refonte de page Phase 3**, consulte le PNG correspondant
(voir [README.md](docs/v1-reference/screenshots/README.md) pour l'index). Les
descriptions textuelles ne suffisent pas : la densité, les couleurs de fond
selon statut et les patterns d'interaction se voient sur l'image.

⚠️ Découverte importante (2026-05-12) : le **layout BDT detail** est **3 colonnes**
(carte gauche unifiée colorée selon statut + Services centre + Pièces droite +
dock bas note+totaux), PAS 4 zones verticales empilées comme initialement décrit
dans le plan β+. Réfère systématiquement à
[`15-bdt-detail-onbench-vert-rempli.png`](docs/v1-reference/screenshots/15-bdt-detail-onbench-vert-rempli.png).

## Contexte produit

flex-app v2 : SaaS multi-tenant de gestion d'atelier de vélo, **migration
depuis une v1 Next.js + Google Sheets** (`yako-san/flex-rev-app`, tag
`v1.0.0` au commit `ef5e604`, version courante `v1.0.17`). Tenant principal
actuel : yako-cyclo (Québec, fr-CA, CAD).

**V1 n'est PAS du Google Apps Script** (erreur que j'ai propagée tôt dans
la session de bootstrap, corrigée depuis). C'est :
- Next.js 14 App Router + TypeScript strict
- Backend = Google Sheets API v4 (5 documents Sheets)
- Auth NextAuth + Google OAuth
- Cache Vercel KV (Upstash)
- Email Gmail draft via API
- PDF `@react-pdf/renderer`

## Référentiel v1

- Repo v1 : `yako-san/flex-rev-app` — accès via session v1 ou via export
  `GET /api/admin/export-v1`. **Mon scope GitHub MCP est limité à
  `yako-san/flex` seulement**, donc pas de lecture directe.
- Document de référence v1→v2 : `docs/v1-v2-parity.md` — audit modèle
  par modèle, à tenir à jour à chaque batch de porting.
- Mémoire v1 partagée : la session v1 publie dans son dépôt sous
  `docs/v2-handoff/v1-reference.md`. yako-san fait le pont.

## Stack v2

- Next.js 15.1 + React 19 + App Router + typedRoutes
- next-intl 3.26 (locales fr-CA / en-CA, localePrefix='always')
- Clerk 6.12 + Organizations (multi-tenant)
- Prisma 5.22 + Postgres Neon (25 modèles)
- Vitest (533 tests passent au 2026-05-08)
- puppeteer-core + @sparticuz/chromium-min pour PDF
- nodemailer (Gmail SMTP) + Resend (fallback)
- Server Actions avec useActionState
- Soft-delete (deletedAt) sur entités principales

### Stack UI (installée Sprint 4 Phase 0, 2026-05-11)

- Tailwind CSS v4 (CSS-first, `@import "tailwindcss"`) + @tailwindcss/postcss
- shadcn/ui (New York, CSS variables) — composants dans `src/components/ui/`
- Radix UI primitives (via shadcn) — Dialog, Dropdown, Select, Popover, Tooltip
- Lucide React (icônes) — pas Heroicons (V1 utilise Heroicons, mapping
  dans v1-ui-bundle.md section 7)
- Tokens V1 dans `src/app/globals.css` (jaune `#fff056`, palette statuts
  vélo/pièces, étapes mécanos, typo `--h1-size` à `--th-size`)
- Pas de @headlessui/react (V1 l'utilise pour Modal, V2 prend shadcn Dialog)

**Avant de raisonner sur la stack** : toujours vérifier contre
`package.json` (l'info CLAUDE.md peut être obsolète si une dep a été
ajoutée/retirée sans MAJ du doc).

## Base de données — IMPORTANT

L'utilisateur a 2 projets Neon :
- **`flex-v2`** — branche `production` — projet de **dev/test** non utilisé par
  Vercel. Ne PAS y appliquer de migrations.
- **`flex-prod`** — branche **`main`** — la **VRAIE prod**, branchée à
  Vercel via l'intégration native Vercel-Neon. **TOUTES** les migrations
  SQL doivent être appliquées ici.

L'hostname prod actuel : `ep-broad-queen-anac9vrl-pooler.c-6.us-east-1.aws.neon.tech`

Quand on fournit du SQL à yako-san pour une migration, **toujours rappeler**
qu'il doit être sur `flex-prod` / `main`, sans quoi la migration tourne sur
le mauvais projet et l'app prod plante avec `column does not exist`.

`DATABASE_URL` Vercel est gérée par l'intégration Vercel-Neon et ne peut
pas être éditée directement (juste « Manage Connection » / « Rotate »
dans l'UI Vercel).

## Conventions git

- **`main` = seule branche pérenne** (décision yako-san 2026-05-11). Toutes
  les modifs passent par PR vers `main`. Les branches `claude/*` sont des
  branches de travail jetables, à supprimer une fois leur PR mergée.
- `main` est **protégée** côté GitHub : push direct refusé (HTTP 403),
  PR obligatoire. Ne pas tenter `git push origin HEAD:main` — ça échoue.
- Branche de travail courante : `claude/resume-flex-v2-0DctE` (à supprimer
  après merge de la PR #6 — Phase 0 UI).
- Branches encore vivantes pendant la transition :
  `claude/bootstrap-flex-app-v2-0Gwel` (défaut GitHub historique, à
  basculer sur `main` quand yako-san s'en occupe dans GitHub Settings).
- Vercel : suit `main` (le plus solide).
- Commits : confiance, push direct sur la branche de travail, mais
  demander avant les opérations destructives (force-push, reset, delete
  branch, drop table).
- Format commit : `feat|fix|docs|refactor(scope): description courte`,
  body en français.

## Dev local

- **Port V2 : `3001`** (V1 occupe 3000 sur la machine de yako-san).
  Commande : `cd ~/flex && pnpm dev` (Next.js détecte 3000 pris et
  bascule auto sur 3001).
- yako-san **n'a jamais lancé V2 en local avant le 2026-05-11** — il
  teste tout via Vercel. Si tu lui demandes de tester localement, le
  préciser explicitement et donner les commandes complètes.
- `NEXT_PUBLIC_APP_URL` dans `.env.example` est un **placeholder mort**
  (jamais lu par le code). Changer le port n'a aucun impact runtime.

## Communication v1 ↔ v2

- Pas de canal MCP direct entre les 2 sessions Claude
- v2 lit ce qui est publié sur `yako-san/flex-rev-app/docs/v2-handoff/`
  (via raw URL si public, sinon yako-san copie-colle ici)
- v2 ne peut pas modifier le code v1 — yako-san relaie

## Profil yako-san

- yako-san n'est pas développeur — préférer commandes copy-pastable et
  explications brèves "ce que tu dois faire"
- Préfère décisions cadrées et plan d'action explicite plutôt que
  exploration ouverte
- A un atelier de vélo réel (yako-cyclo, Montréal). V2 doit fonctionner
  en production pour cet atelier ET pouvoir être vendue à d'autres
  ateliers / corps de métiers (multi-tenant fondamental)
