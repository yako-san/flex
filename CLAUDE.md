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
vérité visuelle pour la refonte UI V2 (Sprint 4 β+ "port look + structure +
flow").

**Provenance** : repo public miroir `yako-san/flex-handoff-public` (alimenté
par la session V1). Les PNG locaux sont une copie 1:1 fetchée via curl pour
éviter dépendance réseau pendant le port. Le `README.md` à côté est le README
officiel du repo public — **ne pas le modifier sans coordination V1** (la
session V1 le maintient).

**Avant de coder une refonte de page Phase 3**, consulte le PNG correspondant.
Les descriptions textuelles ne suffisent pas : la densité, les couleurs de
fond selon statut et les patterns d'interaction se voient sur l'image.

### Découvertes design à respecter (2026-05-12)

- **Layout BDT detail** = **3 colonnes**, PAS 4 zones verticales empilées
  comme initialement décrit dans le plan β+. Réfère à
  [`1a-bon-de-travail-reçu-oui-rv.png`](docs/v1-reference/screenshots/1a-bon-de-travail-reçu-oui-rv.png)
  (BDT RV vide, fond jaune) et
  [`1b-bon-de-travail-éval.png`](docs/v1-reference/screenshots/1b-bon-de-travail-éval.png)
  (BDT en cours rempli, fond vert clair).
  - **Col gauche** (~280px) : carte unifiée colorée selon statut (id+pill,
    vélo, client, dates, séquence travail, AVANCEMENT 4 checkboxes, pills
    CLIENT/VÉLO, NOTE INTERNE textarea).
  - **Col centre** : bloc Services (table + remise %).
  - **Col droite** : bloc Pièces (table + remise + Cost).
  - **Bas (sous centre+droite uniquement)** : NOTE POUR LE CLIENT (+pills
    ÉVAL/FACTURE) et BDCTotaux pill noir avec lien "avance ?" et reste à payer.

- **Couleur de fond suit le statut** : JAUNE pour RV/REÇU, VERT clair pour
  ÉVAL./ON BENCH/APPROUVÉ, ORANGE pour EN ATTENTE, ROSE pâle pour FACTURÉ.
  Pas de gris neutre — la carte gauche et les blocs Services/Pièces sont
  toujours colorés selon l'état du BDT.

- **Dropdowns clients/marques sont customs** (fond noir, texte blanc, header
  coloré "✓ Sélection →"). Pas de `<select>` natif. Voir
  [`1a-bdt-menu-clients.png`](docs/v1-reference/screenshots/1a-bdt-menu-clients.png)
  et [`1a-bdt-menu-marques.png`](docs/v1-reference/screenshots/1a-bdt-menu-marques.png).

- **Page Pièces a 4 onglets** : catalogue / fournisseurs / commandes /
  réception (pills toggle en haut), pas une page unique. Voir captures
  préfixées `4a-` à `4d-`.

- **Page Ventes** = cards collapsibles par n° vente (pas une table plate).
  Voir [`2-ventes.png`](docs/v1-reference/screenshots/2-ventes.png).

- **Page Inventaire** = liste groupée par sections statut avec **lignes
  pleines colorées** (NOUVEAU jaune / EN COURS vert / FACTURÉ rose / STAFF
  gris). Voir
  [`1-inventaire.png`](docs/v1-reference/screenshots/1-inventaire.png).

## État Sprint 4 β+ (livré 2026-05-12)

Sprint 4 β+ « port look + structure + flow V1.0.19 vers V2 » est **livré**
intégralement. 17 PRs mergées sur `main` (PR #6 à #16 de la session
courante). Récap des phases :

| Phase | Livraison |
|---|---|
| **0** | Tailwind v4 + shadcn/ui + tokens V1 + Lucide |
| **1** | Composants UI base (Sidebar, PageHeader, Pill, PillsToggle, DataTable, etc.) |
| **2 composants** | BDCHeader, BDCTotaux, FactureStatusPanel, AjoutItemsModal, ArchiveChoiceDialog, BdtSidecard |
| **2 patterns** | `useDebouncedAutosave`, `toast` (sonner), `useOptimisticPatch` (React 19), `customConfirm` dialog impératif |
| **3.1** | `/admin/bdcs` liste groupée colorée (Nouveau/En cours/Facturé/Livré) |
| **3.2** | `/admin/inventaire/[id]` 3 colonnes (carte gauche unifiée colorée + Services + Pièces + dock bas note/totaux) |
| **3.3** | `/admin/bdcs/new` PageHeader + tokens V1 |
| **3.4** | `/admin` Dashboard 4 KPI + 3 colonnes (BDT terminés/suivi, stock, factures, ventes) |
| **3.6** | `/admin/velos` + `[id]` |
| **3.7** | `/admin/clients` liste groupée alpha + `[id]` |
| **3.8** | `/admin/pieces` 4 onglets V1 + accordéon par catégorie/fournisseur |
| **3.9** | `/admin/ventes` cards collapsibles V1 |
| **3.10** | `/admin/pos` accordéon V1 réception |
| **3.11** | settings/import/maintenance restyle |
| **3.11b** | `/admin/settings` hub grid de 9 cartes + `/admin/settings/atelier` sous-route |
| **3.12** | `/admin/services` unifié Forfaits + À la carte (2 accordéons jaunes) |
| **3.13** | nouvelle `/admin/aide` 3 colonnes 11 tutoriels V1 |
| **3.14** | `/admin/equipe` + `/admin/marques` |
| **3.15** | `/admin/pos/[id]` + `/admin/ventes/[id]` |
| **3.16** | PageHeader sur 19 pages new/edit + sous-routes |
| **3.17** | `/admin/forfaits` restylée + nettoyage final styles inline |
| **4.a** | `customConfirm` + `toast` sur 6 delete/remove buttons |
| **4.b** | Autosave debounced `WorkflowForm` (plus de bouton Save) |
| **4.c** | `useOptimistic` + tokens V1 sur `PieceCmdEditor` |
| **4.d** | `BdtSidecard` AVANCEMENT interactif (4 toggles + pills statut éval inline) |
| **4.e** | `ArchiveChoiceDialog` v1.0.19 câblé sur bouton Archiver |
| **4.f** | Cleanup final — derniers `window.confirm/alert` remplacés (6 fichiers) |

### Phase 3.5 — _skip_

Pas de capture menu mobile iOS dans le PDF V1.0.19, et `/admin/menu`
n'existe pas en V2.

### Audit final

- Aucun `window.confirm` ni `window.alert` dans `src/app/[locale]/admin`.
- Aucun `<h1 style={{ fontSize: '1.75rem' }}>` ni `background: '#1a1a1a'`
  inline.
- Tous les destructifs passent par `customConfirm` (modal stylée V1).
- Tous les Server Action returns d'erreur passent par `toast`.
- Tokens V1 partout (`--jaune`, `--rouge`, `--st-*`, `--cmd-*`, etc.).
- Tests Vitest : 544 passants (16 skipped), type-check propre tout du long.

### Reste à faire (hors scope Sprint 4 β+)

- **Sprint 2.7** : Gmail draft hybride (OAuth en place, restera à activer
  le mode brouillon par défaut sur les Server Actions email).
- **Sprint 2.8** : photos Vercel Blob (`BLOB_READ_WRITE_TOKEN` injecté,
  pas encore de modèle `Photo` Prisma ni d'UI upload sur BDT).
- **Phase 4 polish responsive** : audit complet mobile (tablette atelier
  + iPhone), Lighthouse 90+, axe-core accessibilité.
- **Vraies pages tuto** : `/admin/aide` a 11 cards avec blurbs mais pas
  encore de pages détaillées (`/admin/aide/01-recevoir-velo`, etc.).
- **Refonte `WorkflowForm`** : actuellement un méga form unique avec
  autosave global. Pourrait être éclaté en fragments séparés (remises /
  avance / notes) pour faire moins de round-trips. À voir si nécessaire.

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

⚠️ **État incertain au 2026-05-19** : le `DATABASE_URL` Vercel (Production +
Preview) pointe sur l'hostname `ep-round-hill-amsvsl6u-pooler.c-5.us-east-1.aws.neon.tech`
mais yako-san ne voit PAS ce projet dans son dashboard Neon courant. Le
projet `flex-v2` qu'il voit (endpoint `ep-broad-queen-anac9vrl-pooler.c-6`)
n'est PAS branché à Vercel. Tant que la propriété du compte Neon
`round-hill` n'est pas retrouvée (cf. PR #99 incident), toute migration
SQL appliquée via l'UI Neon **risque de partir sur la mauvaise DB**.

Avant d'envoyer du SQL à yako, **toujours** lui demander de confirmer
l'hostname affiché en haut du SQL Editor Neon avant exécution.

### Avant l'incident — supposé valide

- `flex-v2` (visible par yako) — branche `Production` — endpoint
  `ep-broad-queen-anac9vrl-pooler.c-6.us-east-1.aws.neon.tech`. **Pas
  branché à Vercel.** Peut servir de dev/test.
- `flex-prod` (l'ancien doc disait que c'était ça la vraie prod) —
  hostname et accès **inconnus** actuellement.
- La vraie DB de prod est sur l'endpoint `ep-round-hill-amsvsl6u-pooler.c-5`
  côté un compte Neon que yako tente de retrouver (peut-être Google vs
  GitHub login différent, ou intégration Vercel-Neon créée avec un autre
  email).

### Plan B si le compte Neon `round-hill` reste introuvable

- Créer un nouveau projet Neon `flex-prod-v2` dans le compte de yako
- `pg_dump` depuis l'URL Vercel actuelle vers le nouveau projet
- Swap `DATABASE_URL` côté Vercel (Settings → Environment Variables)
- Pousser une PR `chore(db): bascule sur DB sous contrôle yako-san`

### Note technique sur le build Vercel

`package.json` build script = `prisma generate && next build`. **Pas de
`prisma migrate deploy` automatique**. Toute migration doit être passée
manuellement côté Neon (SQL Editor ou CLI). Erreur fréquente : croire
qu'un build vert = migration appliquée. Faux.

## Conventions git

- **`main` = seule branche pérenne** (décision yako-san 2026-05-11). Toutes
  les modifs passent par PR vers `main`. Les branches `claude/*` sont des
  branches de travail jetables, à supprimer une fois leur PR mergée.
- `main` est **protégée** côté GitHub : push direct refusé (HTTP 403),
  PR obligatoire. Ne pas tenter `git push origin HEAD:main` — ça échoue.
  Idem pour `git push --delete origin <branch>` qui passe par le même
  proxy et renvoie 403. La suppression de branches remote doit se faire
  côté yako-san via https://github.com/yako-san/flex/branches → filtre
  Merged → bulk delete. Mentionner cette étape périodiquement (toutes
  les ~5 PR mergées) sinon les branches s'accumulent.
- **Flux PR rapide** (décision yako-san 2026-05-13, après accumulation
  visible de 8 branches mortes) :
  1. Créer branche `claude/<sujet-court>` côté local
  2. Commit + push
  3. Créer PR via `mcp__github__create_pull_request`
  4. Merger immédiatement via `mcp__github__merge_pull_request`
     (squash) — pas d'attente review humaine sauf changement à risque
     (DB destructif, prod, refactor lourd)
  5. Supprimer branche locale (`git branch -D`)
  6. Branche remote restera tant que yako-san ne fait pas le bulk-delete
- Vercel : suit `main` (Production Branch = `main` confirmé 2026-05-13).
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
