# Handoff — état actuel flex-app v2

Dernière session : 2026-05-03 (PM). Branche : `claude/resume-from-handoff-HginU`.

## ✅ Fait (cette session)

### Étape I — Auth Clerk (LIVE en production)

- Compte Clerk créé, app `flex` configurée
- 7 vars d'env Vercel : `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, 4 URLs (`SIGN_IN_URL`, `SIGN_UP_URL`, `AFTER_SIGN_IN_URL`, `AFTER_SIGN_UP_URL`), `IMPORT_V1_ADMIN_TOKEN`
- Pages : `src/app/[locale]/sign-in/[[...sign-in]]/page.tsx`, idem sign-up, et `dashboard/page.tsx` (server component, `auth()` + redirect)
- Dashboard `export const dynamic = 'force-dynamic'` (sinon prerender → crash Clerk au build)
- Middleware `PUBLIC_ROUTES` exporté + 14 tests sur le matcher
- 1er user créé : `user_3DE1bOni4wBKXux7CpyHPYgNuE0` (yako-san)
- ✅ Vérifié live : `/fr-CA/sign-in`, `/fr-CA/sign-up`, `/fr-CA/dashboard` (redirect anon → sign-in, signed → dashboard)

### Étape J — Endpoint admin import v1 (code prêt, pas testé live)

- `src/lib/import/persist-import-v1.ts` : transaction Prisma unique par workshop, inserts chunkés à 1000, ordre FKs respecté
- `src/lib/import/import-v1-handler.ts` : handler découplé Next.js, double garde (Clerk userId + token admin via header `x-admin-token`), validation Zod
- `src/app/api/admin/import-v1/route.ts` : thin wrapper Next.js
- 13 nouveaux tests (6 persist + 7 handler)

### Cleanup / fixes

- `prisma/schema.prisma` : `directUrl = env("DATABASE_URL_UNPOOLED")` (alignement Vercel Marketplace Neon)
- `package.json` : `build = prisma generate && next build` + `postinstall = prisma generate` (sinon Vercel cache → `PrismaClientInitializationError` au runtime)

### État global

- 28 test files, **515 tests passing**, 16 e2e skipped
- Production : https://flex-tan.vercel.app — actuellement sur commit `a227d8a`

## 🔜 Prochaines étapes possibles

### Option A — Tester l'import v1 end-to-end
1. Récupérer un vrai dump v1 (export depuis l'app v1 actuelle de l'atelier)
2. POST `/api/admin/import-v1` avec :
   - Header `x-admin-token: <IMPORT_V1_ADMIN_TOKEN>`
   - Body : le JSON du dump
3. Vérifier en DB Neon (via `prisma studio` ou requête SQL) que le workshop + entités sont créés
4. Vérifier le `skippedCount` dans la réponse

### Option B — UI minimale du dashboard
- Layout admin (sidebar locales, sign-out button via `<UserButton />` Clerk)
- Liste workshops/clients/velos depuis Prisma
- Forms basiques

### Option C — Multi-tenant via Clerk Organizations
- Un User Clerk peut appartenir à plusieurs Workshops via WorkshopMember
- Activer Organizations dans Clerk dashboard, mapper Org Clerk ↔ Workshop Prisma
- Middleware : injecter le `workshopId` actif dans les server components via `auth()`

### Option D — Migration Prisma sur prod
- Vérifier que la migration init (`20260503133427_init`) est bien appliquée sur Neon prod
  (déjà fait à la dernière session, mais à confirmer après le changement `directUrl`)

## 📋 Cleanup restant

- **Supprimer ancien projet Neon** `flex-v2` (créé manuellement avant le branchement Vercel — devenu obsolète, le projet utile est `flex-prod` / Neon ID `summer-butterfly-58315203`)
- Branche `claude/resume-from-handoff-HginU` : à merger sur `main` éventuellement (pour l'instant, prod tracke directement cette branche via les rebuilds manuels)

## 🚨 Méthodologie utilisateur

L'utilisateur n'est pas développeur. Feedback explicite :

> « tu me donnes des informations partielles, quand tu as besoin que je fasse quelque chose, donne plus d'infos sur la façon d'y arriver et **confirme avant que l'élément d'interface est tjrs à l'endroit que tu suggères** »

→ Avant de dire « clique sur X », demander à l'utilisateur ce qu'il voit. Ne pas spéculer sur les UI externes (Vercel, Clerk, Neon) — leur design change.

→ WebFetch + curl bloqués par le sandbox (403). Pas d'accès aux URLs externes ni aux logs Vercel directement. **Toujours demander à l'utilisateur de copier-coller les erreurs / écrans Vercel.**

→ « Promote to Production » sur Vercel ne se fait pas via API depuis le sandbox — toujours demander à l'utilisateur de cliquer.

## 🐛 Pièges rencontrés (à se rappeler)

1. **Bouton "Copy" Clerk** copie `KEY=value` complet, pas juste la valeur. Toujours préciser à l'utilisateur de ne coller que la partie après le `=` dans le champ Value de Vercel.
2. **Vercel cache + Prisma** : sans `prisma generate` au build, Prisma client est outdated → crash runtime. Fix : modifier `package.json` (`build` + `postinstall`).
3. **Server components + Clerk `auth()`** : tout server component qui appelle `auth()` DOIT avoir `export const dynamic = 'force-dynamic'`, sinon prerender au build crashe.
4. **`Redeploy of X` sur Vercel** = même code source que X, pas le commit le plus récent. Pour avoir le dernier code, il faut soit un nouveau push (auto Preview) soit "Promote" un Preview spécifique en Production.

## 🔧 Stack courte référence

- Next.js 15.1 + React 19 + App Router + typedRoutes
- next-intl 3.26 (locales: fr-CA, en-CA, prefix always)
- Clerk 6.12 (multi-tenant via Organizations à terme)
- Prisma 5.22 + Postgres Neon (pgbouncer pooled via DATABASE_URL, direct via DATABASE_URL_UNPOOLED)
- Zod 3.23 pour validation API
- Vitest + tests TDD strict (515 tests)
- Vercel deploy auto sur push (Preview), Production via promote manuel

Repo : https://github.com/yako-san/flex
Branche active : `claude/resume-from-handoff-HginU`
Production URL : https://flex-tan.vercel.app/
