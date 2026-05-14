---
description: Seed la base de dev (Neon flex-v2) avec des données réalistes — refuse de toucher flex-prod
allowed-tools: Read, Edit, Write, Bash(pnpm db:generate), Bash(pnpm db:validate), Bash(pnpm exec tsx prisma/seed*), Bash(node --version), Bash(cat .env.local)
---

Tu vas seed la base de **dev** avec des données réalistes pour qu'on
puisse tester $ARGUMENTS.

## Garde-fou non négociable

**Avant toute écriture en DB**, vérifie que `DATABASE_URL` pointe bien
vers le projet Neon `flex-v2` (dev) et **PAS** vers `flex-prod`. Le
hostname prod à bloquer est documenté dans `CLAUDE.md` section
« Base de données » — récupère-le là plutôt que de me le hardcoder ici.

Si tu détectes ce hostname dans `DATABASE_URL` (via `.env.local` ou
shell), **arrête-toi immédiatement** et demande à yako-san de switcher
sur le projet dev avant de continuer. La règle CLAUDE.md est explicite :
« Ne JAMAIS toucher la prod pendant les tests ».

## Workflow

1. Confirme le projet Neon ciblé (lis `.env.local`, montre l'hostname).
2. Liste ce que tu vas insérer (workshop, clients, vélos, BDT, etc.) et
   le volume approximatif. Demande validation.
3. Si un script `prisma/seed.ts` existe déjà, lis-le et propose
   d'ajouter à la suite plutôt que d'écraser.
4. Sinon, crée un seed scoped au scénario demandé. Utilise les ULIDs
   (`ulid` package) pour les IDs, jamais des UUIDs ni des cuids.
5. Respecte les contraintes :
   - tenant Clerk Organization (`workshopId` obligatoire)
   - soft-delete (`deletedAt = null` par défaut)
   - Counters (`VELO_SEQUENCE`, `FACTURE_SEQUENCE`) à incrémenter
     proprement, jamais hardcoder un numéro
   - TPS/TVQ Québec sur les factures
6. Lance le seed et donne un récap des entités créées.
