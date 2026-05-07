# CLAUDE.md — flex-app

## Langue de travail

**TOUT EST EN FRANÇAIS.** Chaque réponse, commentaire, message de commit,
description de PR, et nom de variable user-facing doit être en français
(québécois). Les noms techniques de symboles peuvent rester en anglais
(ex: `userId`, `createdAt`) puisque ce sont des conventions du framework.

L'utilisateur (yako-san) est francophone (fr-CA) et a demandé explicitement
plusieurs fois de rester en français. Ne pas dériver vers l'anglais.

## Contexte produit

flex-app v2 : SaaS multi-tenant de gestion d'atelier de vélo, migration
depuis une v1 Google Apps Script. Tenant principal actuel : yako-cyclo
(Québec). Voir `docs/billing-fiscalite-brief.md` pour le dossier billing
en attente.

## Stack

- Next.js 15.5 + React 19 + App Router + typedRoutes
- next-intl 3.26 (locales fr-CA / en-CA, localePrefix='always')
- Clerk 6.12 + Organizations (multi-tenant)
- Prisma 5.22 + Postgres Neon
- Vitest (524 tests passent)
- puppeteer-core + @sparticuz/chromium-min pour PDF
- nodemailer (Gmail SMTP) + Resend (fallback)
- Server Actions avec useActionState
- Soft-delete (deletedAt) sur entités principales

## Conventions

- Branch de travail : `claude/resume-from-handoff-HginU` (en attendant
  rationalisation des branches). Aussi présent : `main` et
  `claude/bootstrap-flex-app-v2-0Gwel` (défaut GitHub) — tous trois
  synchronisés.
- Commits : confiance, push, mais demander avant les opérations destructives
  (delete, force-push, reset).
- yako-san n'est pas développeur — préférer les commandes copy-pastable et
  les explications brèves "ce que tu dois faire".
