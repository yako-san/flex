# Handoff — état actuel du bootstrap flex-app v2

Dernière session : 2026-05-03. Branche : `claude/bootstrap-flex-app-v2-0Gwel`.

## ✅ Fait

- **Schéma Prisma** (24 models) + migration init `prisma/migrations/20260503133427_init/migration.sql`
- **Pipeline import v1→v2** : transformateurs + orchestrateur `importV1(dump)` + tests (488 unit + 16 e2e skipped)
- **App Next.js 15** : `[locale]` segment (fr-CA / en-CA, localePrefix='always'), middleware composé Clerk+intl conditionnel
- **Vercel** : déployé sur https://flex-tan.vercel.app/ (redirige vers `/fr-CA`)
- **Neon Postgres** : projet `flex-prod` (Neon ID `summer-butterfly-58315203`) connecté via Vercel Marketplace, 24 tables créées
  - Env vars auto-injectées : `DATABASE_URL` (pooled), `DATABASE_URL_UNPOOLED`, `POSTGRES_PRISMA_URL`, etc.
  - **Note** : `schema.prisma` référence `DIRECT_URL` mais Vercel injecte `DATABASE_URL_UNPOOLED` → à ajuster (cf. à faire)

## 🔜 Prochaine étape (Étape I — auth Clerk)

L'utilisateur n'a **pas encore** de compte Clerk. Il était sur la doc Quickstart (pas la page signup).

### Phase 1 — Création compte/projet Clerk
1. Aller sur https://clerk.com/ → bouton « Sign up » ou « Start building » (pas la doc !)
2. Créer compte (email/Google/GitHub)
3. Créer une nouvelle application :
   - Nom : `flex` (ou `Flex`)
   - Sign-in options : Email + Google (recommandé pour MVP)
4. Récupérer 2 clés depuis le dashboard Clerk :
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (commence par `pk_test_...`)
   - `CLERK_SECRET_KEY` (commence par `sk_test_...`)

### Phase 2 — Variables d'env Vercel
Sur https://vercel.com/yako-sans-projects/flex/settings/environment-variables, ajouter :
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (3 envs : Production, Preview, Development OK car non-sensitive — c'est public)
- `CLERK_SECRET_KEY` (Production + Preview, **sensitive**, **pas Development**)
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard`

### Phase 3 — Code (côté assistant)
Fichiers à créer :
- `src/app/[locale]/sign-in/[[...sign-in]]/page.tsx` (composant `<SignIn />`)
- `src/app/[locale]/sign-up/[[...sign-up]]/page.tsx` (composant `<SignUp />`)
- `src/app/[locale]/dashboard/page.tsx` (server component, `auth()` + redirect si pas connecté)

Mettre à jour `src/middleware.ts` :
- Routes publiques actuelles : `/`, `/:locale`, `/:locale/sign-in(.*)`, `/:locale/sign-up(.*)`, `/api/health` (déjà OK)
- Tout le reste protégé via `auth.protect()` (déjà fait conditionnellement)

Tests à ajouter : middleware logic (mock auth), redirect dashboard si anonyme.

## 📋 À faire après Étape I

- **Étape J** : endpoint `/api/admin/import-v1` qui reçoit le dump v1 + appelle `importV1` + persiste via Prisma (chunks par modèle, transaction par workshop)
- **Cleanup** :
  - Supprimer ancien projet Neon `flex-v2` (créé manuellement avant le branchement Vercel — devenu obsolète)
  - Ajuster `schema.prisma` : `directUrl = env("DATABASE_URL_UNPOOLED")` au lieu de `DIRECT_URL` (alignement avec ce que Vercel injecte automatiquement)

## 🚨 Méthodologie utilisateur

L'utilisateur n'est pas développeur. Feedback explicite reçu :

> « tu me donnes des informations partielles, quand tu as besoin que je fasse quelque chose, donne plus d'infos sur la façon d'y arriver et **confirme avant que l'élément d'interface est tjrs à l'endroit que tu suggères** »

→ Avant de dire « clique sur X », demander à l'utilisateur ce qu'il voit. Ne pas spéculer sur les UI externes (Vercel, Clerk, Neon) — leur design change.

→ WebFetch est bloqué par Vercel/Cloudflare (403) et probablement par d'autres services SaaS. Ne pas y compter.

## 🔧 Stack courte référence

- Next.js 15.1 + React 19 + App Router + typedRoutes
- next-intl 3.26 (locales: fr-CA, en-CA, prefix always)
- Clerk 6.12 (multi-tenant via Organizations à terme)
- Prisma 5.22 + Postgres Neon (pgbouncer pooled)
- Vitest + tests TDD strict
- Vercel deploy auto sur push

Repo : https://github.com/yako-san/flex
Branche bootstrap : `claude/bootstrap-flex-app-v2-0Gwel`
