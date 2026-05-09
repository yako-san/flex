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

- Branche de travail courante : `claude/resume-from-handoff-HginU`
- Branches synchronisées : `main` et `claude/bootstrap-flex-app-v2-0Gwel`
  (défaut GitHub)
- 3 branches alignées sur HEAD à chaque push (les 3 sont fast-forwardées
  ensemble pour que peu importe celle que Vercel suit, c'est à jour)
- Commits : confiance, push, mais demander avant les opérations
  destructives
- Format commit : `feat|fix|docs|refactor(scope): description courte`,
  body en français

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
