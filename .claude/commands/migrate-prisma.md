---
description: Créer et appliquer une migration Prisma en respectant la règle flex-prod (Neon main) — JAMAIS flex-v2
allowed-tools: Read, Edit, Bash(pnpm prisma:*), Bash(pnpm db:*), Bash(git diff), Bash(git status)
---

Tu vas créer une migration Prisma pour le changement décrit ci-après. Suis
le protocole flex-app v2 à la lettre — la prod yako-cyclo tourne sur Neon
`flex-prod` / `main` et **aucune migration ne doit jamais atterrir sur
`flex-v2`** (projet de dev/test).

Changement demandé : $ARGUMENTS

## Protocole strict

1. **Lis `prisma/schema.prisma`** et résume le delta que tu vas y apporter
   en français (1 paragraphe). Demande confirmation à l'utilisateur si
   le changement touche à une entité avec soft-delete (`deletedAt`) ou à
   un Counter (numérotation séquentielle facture/vélo).

2. **Édite `prisma/schema.prisma`** avec le changement minimal.

3. **Génère la migration en mode `--create-only`** (jamais `migrate dev`
   tout court — on ne veut pas pousser sur Neon depuis Claude) :

   ```
   pnpm prisma migrate dev --create-only --name <nom_snake_case>
   ```

4. **Lis le SQL généré** dans `prisma/migrations/*/migration.sql`. Si tu
   vois un `DROP COLUMN`, `DROP TABLE`, `ALTER COLUMN ... DROP NOT NULL`
   ou tout opérateur destructif, **arrête-toi** et demande validation
   explicite à yako-san avant de continuer.

5. **Produis un bloc copy-paste pour yako-san** au format suivant :

   > ⚠️ Migration à appliquer sur **Neon `flex-prod` / branche `main`**
   > (PAS `flex-v2`). Hostname prod actuel :
   > `ep-broad-queen-anac9vrl-pooler.c-6.us-east-1.aws.neon.tech`.
   >
   > ```sql
   > -- contenu de migration.sql
   > ```
   >
   > Une fois exécuté côté Neon, dis-moi « ok appliqué » et je marque
   > la migration localement.

6. **Attends la confirmation utilisateur.** Quand il dit appliqué, lance :

   ```
   pnpm prisma migrate resolve --applied <nom_migration>
   pnpm prisma generate
   ```

7. **Commit** : `feat(prisma): <description>` avec le SQL dans le body.

## Garde-fous

- Ne lance JAMAIS `pnpm prisma db push` (contourne migrations).
- Ne lance JAMAIS `pnpm prisma migrate reset` sans confirmation explicite.
- Si `DATABASE_URL` locale pointe vers `flex-prod` (vérifier hostname),
  refuse et demande à yako-san de switcher sur le projet dev.
