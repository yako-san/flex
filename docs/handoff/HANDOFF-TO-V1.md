# HANDOFF V2 → V1 (état 2026-05-12)

> Pour la session Claude qui travaille sur `yako-san/flex-rev-app` (V1).
> Pendant inverse du handoff V1→V2 reçu au démarrage Sprint 4.

## TL;DR

Sprint 4 β+ V2 est **livré intégralement** (26 PRs mergées dans la session
2026-05-12). V2 ressemble maintenant à V1.0.19 pour les flows essentiels.
Le tenant `yako-cyclo` peut basculer V2 en prod quand prêt.

## État V2 (ce qui est fait)

### Pages refondues selon les 28 captures V1.0.19

Toutes les pages admin V2 ont été refondues page par page selon les captures
officielles V1.0.19 fournies via le repo public miroir `yako-san/flex-handoff-public` :

- `/admin` Dashboard : 4 KPI cards + 3 colonnes (BDT terminés, stock, factures, ventes)
- `/admin/bdcs` (= Inventaire) : liste groupée colorée par section statut, lignes pleines couleur statut
- `/admin/inventaire/[id]` BDT detail : **3 colonnes** (carte gauche unifiée colorée
  selon statut + Services + Pièces, dock bas note/totaux) — pas 4 zones empilées
  comme le plan écrit initial le décrivait
- `/admin/velos`, `/admin/clients`, `/admin/pieces` (4 onglets), `/admin/ventes`,
  `/admin/pos`, `/admin/services` (Forfaits + À la carte unifié), `/admin/equipe`,
  `/admin/marques`, `/admin/forfaits`
- Nouvelle `/admin/aide` (3 colonnes 11 tutoriels V1)
- `/admin/settings` hub grid de 9 cartes + sous-route `/atelier`
- 19 pages new/edit avec PageHeader cohérent

### Patterns Phase 2 adoptés

V1 utilise des patterns spécifiques que V2 a portés :

- `useDebouncedAutosave` : autosave silencieux 500ms (pas de bouton Save)
- `useOptimistic` React 19 : changement instantané UI + sync serveur
- `toast` (sonner) : feedback inline, pas d'alert
- `customConfirm` : dialog stylé V1 (variants danger), remplace `window.confirm`
- `ArchiveChoiceDialog v1.0.19` : un clic = mode paiement + facture PAYÉ + archive atomique

### Sprint 2.8 photos livré

- Model `BdcPhoto` Prisma + migration appliquée sur Neon `flex-prod`
- Lib helper `src/lib/storage/blob.ts` (Vercel Blob, MIME whitelist JPG/PNG/WebP/HEIC/HEIF, max 10 Mo)
- Server Actions : upload / delete (soft + hard) / reorder / patch metadata
- UI : drag&drop upload + queue avec preview, gallery avec badges kind colorés (AVANT/APRES/DEGAT/SERIE/AUTRE), lightbox plein écran

### Sprint 2.7 Gmail draft hybride actif

- OAuth Google connecté côté backend
- Action `sendEmail({ mode: 'draft' | 'send' })` opérationnelle
- UI EmailButtons propose toggle « Brouillon Gmail » / « Envoyer maintenant »
  quand Workshop a connecté un compte Gmail

## Ce que V2 attend de V1 (asks)

Aucune demande bloquante actuellement. Mais ces choses **resteraient utiles** :

### 1. Mises à jour des screenshots `yako-san/flex-handoff-public`

Quand l'UI V1 évolue (nouvelles features V1.0.20+), publier les nouvelles
captures dans le repo public miroir avec la **même convention de nommage**
qu'à V1.0.19 :

- Section 0 : `0-archives.png`, `0-login.png`, `0a-Dashboard.png`, etc.
- Section 1 : `1-inventaire.png`, `1a-bon-de-travail-reçu-oui-rv.png`, etc.

V2 fetche ces URLs raw publiquement et reverse-engineer l'UI. Si la convention
de naming change, V2 doit refaire son indexation.

### 2. Schema export 1.1.0 (templates emails + tailles vélo + paramètres)

V1 avait planifié un bump schema 1.1.0 pour inclure :
- `templates` : emails (FR/EN) et SMS depuis Sheet `_EMAIL_TEMPLATES_`
- `tailles` : liste canonique des tailles vélo
- `parametres` : contenu brut Sheet `_PARAMÈTRES_`

Si V1 a livré le 1.1.0, V2 peut le réimporter via `GET /api/admin/export-v1`
côté V1 puis `/admin/import` côté V2. Status à confirmer côté V1.

### 3. Anomalies de données restantes

Audit V1 au tag `v1.0.0` avait identifié :
- `pieceId` dupliqués (Brompton import) → V2 dédoublonne déjà via `(sku, nom)` ou nouveau UUID
- Courriels Markdown résiduels → V2 strip à l'import
- Dates Excel serial mixtes → V2 normalise

Pas d'action V1 nécessaire mais à savoir si V1 fait un nouveau dump à
re-importer.

## V2 stack actuelle (pour info V1)

| Couche | V2 |
|---|---|
| Framework | Next.js 15.1 App Router + React 19 + TypeScript strict |
| DB | Postgres Neon (`flex-prod` / branche `main`) |
| ORM | Prisma 5.22 |
| Auth | Clerk 6.12 + Organizations (multi-tenant) |
| UI | Tailwind v4 + shadcn/ui + Radix + Lucide |
| Storage | Vercel Blob (Sprint 2.8 photos) |
| Email | Nodemailer (Gmail SMTP) + Resend fallback + Gmail draft hybride |
| Tests | Vitest 2.1 (590 passants) + happy-dom optin |
| i18n | next-intl 3.26 (fr-CA / en-CA) |
| Prod URL | https://flex-tan.vercel.app |

## Communication V1 ↔ V2

Toujours pas de canal MCP direct. yako-san continue de faire le pont :
- V2 ne peut pas modifier V1
- V1 ne peut pas modifier V2

V2 lit le repo public miroir `yako-san/flex-handoff-public` (captures uniquement).
V1 reste le référentiel "produit" — yako-san décide quand basculer prod V1 → V2.

## Pour V1 si tu redémarres une session

V1 a son propre `docs/v2-handoff/` qui contient l'inverse de ce doc. Référer
au tag `v1.0.0` ou `v1.0.19` selon la version cible et le bundle de handoff
historique côté V1.

Côté V2 :
- `docs/handoff/primer.md` — démarrage rapide V2
- `docs/handoff/hindsight.md` — leçons apprises
- `docs/handoff/obsidian/` — vault de 14 notes interconnectées
- `docs/v1-reference/screenshots/` — copie locale des 28 captures V1.0.19

Bon dev.
