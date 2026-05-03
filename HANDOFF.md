# Handoff — état actuel flex-app v2

Dernière session : 2026-05-03 (PM/soir). Branche : `claude/resume-from-handoff-HginU`.

## ✅ Fait (cette session)

### Étape I — Auth Clerk (live prod)

- Compte Clerk + 7 vars Vercel (publishable/secret + URLs + IMPORT_V1_ADMIN_TOKEN)
- Pages sign-in / sign-up / dashboard
- Middleware avec `PUBLIC_ROUTES` exporté + 14 tests
- 1er user : yako-san (`user_3DE1bOni4wBKXux7CpyHPYgNuE0`)

### Étape J — Import dump v1 (live prod, dump réel persisté)

**Code livré :**
- `persistImportV1` : transaction Prisma unique, inserts chunkés à 1000, ordre FKs
- `handleImportV1` : double garde Clerk userId + token admin
- `/api/admin/import-v1` (REST) + `/admin/import` (UI upload)
- `createPhantomVelosForOrphanedBdcs` : crée des vélos virtuels à partir des BDC archivés v1 dont les vélos n'apparaissent plus dans la liste actifs (sinon ~50% historique facturation perdu)
- Dédup BDC dans `transformBdcs` : si même id en actifs+archives, garde l'archive

**Schéma assoupli (4 unique constraints retirées) :**
- `Piece(workshop_id, legacy_code)` : la dédup v1→v2 produit N pièces v2 pour 1 pieceId v1 → multiplicité légitime
- `Piece(workshop_id, sku)` : SKU = ref fournisseur, doublons légitimes (même SKU pour 2 items distincts)
- `Bdc.velo_id` : un vélo peut avoir plusieurs BDC dans son historique (cycles de visites)
- `Velo.bdc` : `Bdc?` → `bdcs Bdc[]` (one-to-many)

**Migrations Prisma créées (mais NON auto-appliquées au build cf P3005) :**
- `20260503184000_piece_legacy_code_not_unique`
- `20260503190000_piece_sku_not_unique`
- `20260503193000_bdc_velo_id_not_unique`
- Toutes appliquées **manuellement** via Neon SQL editor (DROP UNIQUE INDEX + CREATE INDEX)

**Bugs fixés :**
- `prisma generate` ajouté au build script (Vercel cache layout sinon → PrismaClientInitializationError)
- Dashboard `force-dynamic` (sinon prerender + auth() crash au build)
- `directUrl = env("DATABASE_URL_UNPOOLED")` (alignement Vercel Marketplace)
- String ISO → Date conversion dans persist (Velo/VenteDirecte/Po)

**Résultat import live (dump yako-cyclo) :**
- 1 workshop, 26 clients, 25 vélos (12 actifs + 13 phantoms), 25 BDCs (12 actifs + 13 archives), 51+43=94 BDC items, 87 tasks
- 252 pièces, 70 services, 3 forfaits, 28 task templates
- 10 ventes, 7 POs, 64 PO items, 356 translations, 353 legacy mappings
- 37 entrées invalides ignorées (sous-tâches forfait, BDC 0106 client absent, etc.)

### Étape K — UI dashboard admin (in this push)

- `/admin/layout.tsx` : sidebar nav + Clerk UserButton
- `/admin` : dashboard avec stats du workshop (10 cartes)
- `/admin/clients` : table clients avec count vélos
- `/admin/velos` : table vélos avec status badges + count BDCs
- `/admin/bdcs` : table BDCs avec archive status badges + totals
- `/admin/import` : (existant) refactored sans auth check duplicate
- `/dashboard` : redirect vers `/admin` (l'env var Clerk pointe encore sur /dashboard)

## 🔜 Suite possible

### Reste sur l'import
- Investiguer les 37 skipped (ne sont sans doute pas critiques mais utile de savoir)
- Soft delete cleanup : si on veut re-importer, `TRUNCATE TABLE workshop CASCADE` puis upload
- L'email markdown bracket (`[a@venir.ca](mailto:...)`) n'est pas nettoyé. Le normalisateur `strip-markdown-email` existe mais n'est pas appliqué dans `transformClients`. À ajouter.

### UI à étoffer
- Pages détail (cliquer sur un client → ses vélos + BDCs)
- Recherche / filtres
- Inventaire pièces avec stock
- Forms CRUD (créer un client, enregistrer une vente comptoir, etc.)

### Infra
- **Baseline Prisma migrations** : une fois la prod alignée, lancer `prisma migrate resolve --applied <init>` puis ré-activer `prisma migrate deploy` au build pour automatiser. Évite les SQL manuels.
- **Multi-tenant via Clerk Organizations** : pour l'instant un seul workshop, les pages admin font `findFirst()`. À refactor quand plusieurs ateliers.
- **Suppression vieux Neon project** `flex-v2` (créé manuellement avant l'intégration Vercel, obsolète).

## 🚨 Méthodologie utilisateur

L'utilisateur n'est pas développeur :

> « tu me donnes des informations partielles, quand tu as besoin que je fasse quelque chose, donne plus d'infos sur la façon d'y arriver et confirme avant que l'élément d'interface est tjrs à l'endroit que tu suggères »

Règles :
- Avant un clic destructif (SQL, delete) : **demander d'abord ce que l'utilisateur voit**, attendre la réponse, **puis** envoyer la commande dans un message séparé. Ne jamais mettre la commande dans le même message que la demande de vérif.
- Mode **autopilote** : l'utilisateur peut le demander pour les phases longues. Dans ce mode, on bundle toutes les actions en une seule liste finale et on évite les questions intermédiaires.
- WebFetch + curl bloqués par le sandbox → toujours demander à l'utilisateur de copier-coller les erreurs Vercel/Neon.
- Vercel "Promote to Production" pas accessible API → toujours demander à l'utilisateur de cliquer.

## 🐛 Pièges rencontrés

1. **Bouton "Copy" Clerk** copie `KEY=value`, pas juste la valeur
2. **Vercel cache + Prisma** : `prisma generate` requis au build
3. **Server components + Clerk auth()** : `force-dynamic` obligatoire
4. **Vercel "Redeploy of X"** = même code source, pas le commit le plus récent. Pour mettre à jour, push un commit OU promote un Preview spécifique
5. **Prisma migrate deploy** échoue P3005 si DB non baselinée → SQL manuels en attendant
6. **DateTime Prisma** ≠ string ISO : conversion explicite en `Date` requise
7. **v1 export inclut souvent un BDC en double** (snapshot actif + archive) → dédup nécessaire
8. **Vélos archivés v1 absents de la liste velos** → phantom velos requis pour préserver historique BDC

## 🔧 Stack courte référence

- Next.js 15.5 + React 19 + App Router + typedRoutes
- next-intl 3.26 (locales: fr-CA, en-CA, prefix always)
- Clerk 6.12
- Prisma 5.22 + Postgres Neon (pgbouncer pooled via DATABASE_URL, direct via DATABASE_URL_UNPOOLED)
- Zod 3.23 pour validation API
- Vitest, **524 tests passing**
- Vercel deploy auto sur push (Preview), Production via promote manuel

Repo : https://github.com/yako-san/flex
Production URL : https://flex-tan.vercel.app/
