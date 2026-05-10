# V1 ↔ V2 — audit de parité

**Source v1** : `yako-san/flex-rev-app` tag `v1.0.0` (commit `ef5e604`),
documenté dans `docs/v1-handoff/v1-reference.md` (à venir) ou récupéré
inline depuis la session v1.

**Cible v2** : `yako-san/flex` HEAD courant, schema Prisma 25 modèles.

**Date audit** : 2026-05-08, par session v2 (Opus 4.7 / 1M context).

**Dernière mise à jour** : 2026-05-10, ajout plan Sprint 4 (port UI/UX V1).

**Statut** : Sprint 1 + Sprint 2 (sauf 2.8) + Sprint 3 entièrement livrés.
Sprint 2.7 (Gmail draft hybride) débloqué et livré le 2026-05-09 après
configuration OAuth Google côté GCP + Vercel. Reste 2.8 (photos Vercel
Blob) — débloqué côté config (BLOB_READ_WRITE_TOKEN injecté), prêt à coder.

## Changelog

- **2026-05-08 / Sprint 1** : `BdcEvalStatus` aligné (`INDECIS`/`ATTENTE`
  ajoutés, `EN_ATTENTE` renommé `ATTENTE`, back-compat `'' && checkOk →
  APPROUVE`) ; `Bdc.avance{Montant,Mode,Note}` + enum `AvanceMode` ;
  `BdcItem.cmdStatus` (enum `BdcPieceCmdStatus` 6 valeurs) + `cmdNote` +
  `statusText` ; `Bdc.noteClientEval/Facture` (migration Velo→Bdc avec
  copie pour BDT actifs uniquement) ; parser `parseActive` enrichi
  (oui/non/yes/no/y/n/1/0) ; `src/lib/velo/status-labels.ts` : labels
  FR/EN + couleurs V1 pour VeloStatus et BdcEvalStatus.

- **2026-05-08 / Sprint 2.1+2.2+2.3** : UI Sprint 1 câblée — formulaire
  BDT avec section avance (montant + mode + note) et notes client (eval
  + facture séparées de notes interne) ; composant `PieceCmdEditor`
  inline sur items pièces (badge sigle ...,—,√,$,#,@ + popup statut +
  textarea note) ; PDFs/courriels lisent `noteClientEval/Facture` depuis
  Bdc (au lieu de Velo) ; émission facture snapshot
  `bdc.noteClientFacture` → `FactureLog.notes` immutable.

- **2026-05-08 / Schema export V1 1.1.0** : type `V1Dump` étendu (clés
  optionnelles `templates`, `tailles`, `parametres`) ;
  `transform-templates.ts` mappe les clés V1 explicites
  (`eval_subject_fr`, `eval_message_en`, fragments
  `greeting/intro/cta/outro`, `signature_yako`/`cf`, etc.) →
  `Workshop.emailTemplates` structuré multi-locale FR/EN ;
  `dump.tailles` répliqué sur chaque marque ; `dump.parametres`
  préservé dans `Workshop.legacyV1Extras`.

- **2026-05-08 / Refresh partiel V1 1.1.0** : action serveur
  `refreshFromDumpAction` qui hydrate UNIQUEMENT les nouveaux champs
  `Workshop.emailTemplates` + `Marque.taillesDisponibles` +
  `legacyV1Extras.parametres` sans toucher aux clients/vélos/BDT déjà
  importés. UI dédiée sur `/admin/import` (workshop existant).

- **2026-05-08 / Templates multi-locale** : `EmailTemplates` refondu en
  `{ subject?: LocaleString; body?: LocaleString } & TemplateFragments`
  pour eval/facture/vente/courrielSuivi ; `evalEmailTemplate/Subject`
  +  `factureEmailTemplate/Subject` + `suiviEmailTemplate/Subject`
  prennent `clientLang` et sélectionnent la bonne locale via
  `pickLocale` (fallback FR↔EN automatique). UI templates avec onglets
  🇫🇷/🇬🇧 et fragments granulaires repliables. ClientInfo.lang ajouté.

- **2026-05-08 / Sprint 2.4** : facture statut PAYE/EMIS/ANNULE + mode
  paiement éditable inline depuis page client (composant
  `FactureStatutControls`) ; action `setFactureStatutAction` (V1
  équivalent `/api/factures/log-status`).

- **2026-05-08 / Sprint 2.5** : courriel de suivi post-livraison BDT.
  `Bdc.cbSuiviEnvoye` + `EmailKind.BDT_SUIVI` ; `suiviEmailTemplate/
  Subject` (multi-locale) ; `sendSuiviEmailAction` ; bouton sur fiche
  BDT « Envoyer le courriel de suivi » (vert si déjà envoyé).

- **2026-05-08 / Sprint 2.6** : PO ADHOC — création + réception en 1
  étape. `Po.isAdhoc` + `PoItem.categorie/notes` ; action
  `createAdhocPoAction` (auto-création Piece si nouvelle, snapshot prix
  achat→vente avec marge 50% défaut, StockMovement immédiat) ; UI
  `/admin/pos/adhoc` multi-items + bouton vert sur liste POs.

- **2026-05-08 / Sprint 2.9** : `/api/admin/snapshot` — backup JSON
  complet du workshop (22 tables) téléchargeable depuis
  `/admin/maintenance`. Métadonnées + counts + decimals préservés.

- **2026-05-08 / Sprint 2.10** : drop `Velo.noteClientEval/Facture`
  deprecated. Migration SQL avec ROW_NUMBER() pour copier les notes
  Velo→Bdc le plus récent (BDT archivés inclus) avant DROP COLUMN.
  `transform-bdcs` écrit désormais `noteClientEval/Facture` dans
  `Bdc` (V1 source = `noteClient`/`noteClientFacture` cols V/W ligne
  GAP). `transform-velos`, `create-phantom-velos`, `V2VeloDraft`,
  page vélo : nettoyés. Tests à jour.

- **2026-05-08 / Sprint 3.1 + 3.2** : `Piece.notes` + `Piece.groupe`
  ajoutés (V1 col AE notes, V1 groupe sous-classification dans la
  catégorie). UI form pièce + action serveur étendus. `Service.
  categoriePrio` était déjà en place dans le schema.

- **2026-05-08 / Sprint 3.3** : `/api/admin/export/labels` —
  étiquettes A4 imprimables avec code-barre Code 128 SVG (lib
  `bwip-js`), grille 5×13 = 65 étiquettes par page. Filtres URL :
  `ids`, `categorie`, `fournisseur`, `withSku`. Bouton sur
  `/admin/pieces`.

- **2026-05-09 / Sprint 2.7 — Gmail draft hybride** : OAuth Google
  configuré côté GCP/Vercel par yako-san. Schema :
  `Workshop.googleRefreshToken + googleEmail`. Routes API :
  `/api/auth/google/{start,callback,disconnect}` (state cookie CSRF,
  exchange code → tokens, persist refresh_token).
  `src/lib/email/google-oauth.ts` (helpers OAuth) +
  `src/lib/email/gmail-draft.ts` (createGmailDraft via Gmail API
  `users.drafts.create`, MIME multipart base64url). `EmailStatus.DRAFT`
  ajouté. `sendEmail` accepte mode='send'|'draft'. Les 3 actions
  email-actions BDT (eval/facture/suivi) acceptent `mode` + reçoivent
  `googleRefreshToken` du workshop. UI `EmailButtons` : toggle
  📝 Brouillon Gmail / 🚀 Envoyer maintenant (default brouillon si
  Gmail connecté, sinon envoi direct). UI Settings :
  `GmailConnectionPanel` (Connecter / Reconnecter / Déconnecter).

---

## 0. Stack — comparaison

| Couche | V1 | V2 | Drift |
|---|---|---|---|
| Framework | Next.js **14** App Router + TS strict | Next.js **15.1** App Router + TS strict | ✅ aligné |
| Backend données | Google Sheets v4 (5 docs) | Postgres / Prisma 5.22 / Neon | ✅ migration prévue |
| Auth | NextAuth + Google OAuth | Clerk 6.12 + Organizations | ✅ multi-tenant nécessaire |
| Cache | Vercel KV (Upstash Redis) cross-lambda | DB transactions | ✅ |
| Email | Gmail draft (manuel) | Gmail SMTP (auto) + Resend fallback | ⚠️ V1 = draft pour validation manuelle ; V2 = envoi direct (changement de UX à valider) |
| PDF | `@react-pdf/renderer` | `puppeteer-core` + `@sparticuz/chromium-min` | ✅ V2 = HTML→PDF, plus fidèle au design |
| Tests | Vitest 47 tests | Vitest 533 tests | ✅ |
| i18n | FR-CA seulement | FR-CA + EN-CA via next-intl | ✅ |
| PWA | manifest + favicons SVG | ❌ pas encore | À porter (priorité basse) |
| Réservations | Square API | natif (sortie de Square) | ✅ délibéré |
| Billing | aucun | Stripe (champs préparés, intégration en attente) | ✅ |

---

## 1. Modèles — matrice de parité

Légende :
- ✅ matche (champ présent V1 → V2 sans transformation)
- 🔁 transformé (mapping nécessaire à l'import)
- ➕ ajouté en V2 (pas en V1)
- ❌ manquant en V2 (à porter)

### 1.1 Workshop / WorkshopMeta

| V1 | V2 | Statut |
|---|---|---|
| `id: 'yako-cyclo'` | `Workshop.slug` | ✅ |
| `name: 'Yako Cyclo'` | `Workshop.name` | ✅ |
| `lang: 'FR'` | `Workshop.defaultLocale = 'fr-CA'` | 🔁 mapping `FR` → `fr-CA` |
| `currency: 'CAD'` | `Workshop.currency` | ✅ |
| `timezone` | `Workshop.timezone` | ✅ |
| (pas de champ) | `Workshop.country` | ➕ |
| (pas de champ) | `Workshop.activeLocales: Json` | ➕ |
| (pas de champ) | `Workshop.fiscalEntity: Json` | ➕ (raison sociale, NEQ, TPS#, TVQ#, adresse, Google Reviews, Instagram, Facebook, footerText, …) |
| (pas de champ) | `Workshop.logoBase64` | ➕ |
| (pas de champ) | `Workshop.clerkOrgId` | ➕ multi-tenant |
| (pas de champ) | `Workshop.legacyV1Extras: Json` | ➕ dump v1 brut |
| (pas de champ) | `Workshop.emailTemplates: Json` | ➕ à hydrater quand schema export 1.1.0 livre `templates` |
| (pas de champ) | `Workshop.stripeCustomerId / stripeSubscriptionId` | ➕ |

**Action** : aucune action — tout est en place, en attente de l'export `templates`.

### 1.2 Client

| V1 | V2 | Statut |
|---|---|---|
| `prenom`, `nom`, `nomComplet` | `Client.prenom`, `Client.nom` | ✅ (`nomComplet` calculé côté UI) |
| `tel` | `Client.telephone` | 🔁 normalisation E.164 à l'import |
| `indicatif` (default `+1`) | `Client.indicatif` | ✅ |
| `courriel` | `Client.courriel` | ✅ |
| `commPref: 'Téléphone' \| 'Texto' \| 'Courriel'` | `Client.commPref: EMAIL \| SMS \| TELEPHONE \| AUCUN` | 🔁 mapping ; V2 ajoute `AUCUN` (volontaire) |
| `lang: 'FR' \| 'EN'` | `Client.lang: VarChar(10)` | 🔁 mapping `FR` → `fr-CA` |
| `lead: 'Cyclo Flex' \| 'yako.cyclo' \| string` | `Client.lead: String?` | ✅ texte libre OK |
| `remise: 0\|10\|15\|25\|50` | `Client.remiseDefault: Decimal?(5,2)` | ✅ |
| `adressePostale: string` | `Client.adressePostale: Json?` | 🔁 V1 texte libre, V2 JSON structuré (mais accepte string aussi) |
| `notes` | `Client.notes` | ✅ |
| `dateIn`, `dateOut` | `Client.createdAt`, `Client.deletedAt` | 🔁 dateOut ≈ deletedAt |
| `bdcIds[], velos[]` | (relations Prisma) | ✅ |
| `googleResourceName` | (ignoré V2 multi-tenant) | ⚠️ stocké dans `legacyRawV1` mais pas exploité |

**Action** : aucune. L'import actuel (`transformClients`) fait le mapping. À vérifier que `commPref` traite bien `'Téléphone' → 'TELEPHONE'`, etc.

### 1.3 Velo

| V1 | V2 | Statut |
|---|---|---|
| `id: '0042'` (string padded) | `Velo.veloNumero: Int` (auto-padded à l'affichage) | 🔁 |
| `status: 'RV' \| 'REÇU' \| 'ÉVAL.' \| 'EN ATTENTE' \| 'APPROUVÉ' \| 'ON BENCH' \| 'CTRL QLTÉ' \| 'FINI' \| 'LIVRÉ' \| 'FACTURER' \| 'FACTURÉ'` | `VeloStatus: RV \| RECU \| EVAL \| EN_ATTENTE \| APPROUVE \| ON_BENCH \| CTRL_QLTE \| FINI \| LIVRE \| FACTURER \| FACTURE` | 🔁 mapping accents/espaces |
| `date1, date2, date3` | `Velo.date1/2/3: DateTime?` | ✅ |
| `client, marque, modele, couleur, taille, serie` | `Velo.clientId, marqueId, modele, couleur, taille, numeroSerie` | ✅ relations |
| `noteVelo` | `Velo.noteVelo` | ✅ |
| `noteClientEval` | `Velo.noteClientEval` | ✅ |
| `noteClientFacture` | `Velo.noteClientFacture` | ✅ |
| `eval, meca, ctrl` (mécanos) | `Velo.evalMecanoId, mecaMecanoId, ctrlMecanoId` | ✅ |
| `services, pieces` (string concaténée) | (vue calculée depuis BdcItem) | ✅ |
| `notes` | `Velo.notes` | ✅ |
| (pas de soft-delete) | `Velo.deletedAt` | ➕ ⚠️ **règle métier à porter** : interdire deletedAt si BDT actif lié (status ∉ {LIVRE, FACTURE, REFUSE}) |

**Action** : ajouter validation côté server action `deleteVeloAction` pour empêcher soft-delete si BDT non terminé. Existe peut-être déjà — à vérifier.

### 1.4 Bdc

| V1 | V2 | Statut |
|---|---|---|
| `id` | `Bdc.id` | ✅ |
| `dateIn, dateOut` | `Bdc.createdAt, deletedAt` | 🔁 |
| `veloDesc, clientNom` | (relations) | ✅ |
| `noteClient` (col V GAP, éval) | `Bdc.noteClientEval` | ✅ migré Velo→Bdc en Sprint 1 (4 BDT actifs copiés) |
| `noteClientFacture` (col W GAP) | `Bdc.noteClientFacture` | ✅ migré Velo→Bdc en Sprint 1 |
| `checkEval, checkOk, checkBds, checkOut` | `Bdc.cbEvalEnvoye, cbEval, cbBonSortie, cbArchiver` | ✅ |
| `evalStatus: '' \| APPROUVE \| REDUX \| ATTENTE \| REFUSE` | `BdcEvalStatus: INDECIS \| ATTENTE \| APPROUVE \| REDUX \| REFUSE` | ✅ aligné Sprint 1. Back-compat `'' && checkOk → APPROUVE` codée dans `mapEvalStatus`. |
| `archiveStatus` (lu depuis ARCHIVES col C) | `Bdc.archiveStatus: BdcArchiveStatus` | ✅ |
| `noteVelo` (copié de INVENTAIRE) | `Velo.noteVelo` | ✅ relation |
| `evalMecano, mecaMecano, ctrlMecano` | `Velo.*MecanoId` | ✅ relation |
| `noteInterne` (col W ARCHIVES) | `Bdc.notes` | ✅ |
| `remiseSvc: { type, value }` | `Bdc.remiseSvcType + remiseSvcValue` | ✅ |
| `remisePce: { type, value }` | `Bdc.remisePceType + remisePceValue` | ✅ |
| `avance: { montant, mode, note }` (v1.0.15+) | `Bdc.avanceMontant + avanceMode + avanceNote` | ✅ ajouté Sprint 1 (3 colonnes Postgres + enum `AvanceMode = COMPTANT \| INTERAC \| CARTES`). UI à brancher en Sprint 2. |
| `items[]` | `Bdc.items: BdcItem[]` | ✅ |
| `totalServices, totalPieces` | `Bdc.totalServices, totalPieces` | ✅ |

**Actions BDC** :
- ✅ [P1 Sprint 1] BdcEvalStatus aligné
- ✅ [P1 Sprint 1] avance ajoutée
- ✅ [P1 Sprint 1] noteClient migré Velo→Bdc
- 🟡 [Sprint 2] Brancher UI avance dans le formulaire BDT
- 🟡 [Sprint 2] Lire `noteClientEval/Facture` depuis Bdc (pas Velo) dans PDFs/courriels
- 🟢 [fin Sprint 2] Droper `Velo.noteClientEval/Facture` (deprecated transition complète)

### 1.5 BdcItem — gestion forfaits / pièces

| V1 (BDCServiceItem ∪ BDCPieceItem) | V2 (BdcItem unifié) | Statut |
|---|---|---|
| `BDCServiceItem.serviceId` | `BdcItem.serviceId` | ✅ |
| `BDCServiceItem.nom` | `BdcItem.labelSnapshot` | ✅ |
| `BDCServiceItem.fait: boolean` | `BdcItem.tasks[] (BdcItemTask)` ou tâche inline | 🔁 V1 = checkbox unique sur l'item ; V2 = sous-tâches (`BdcItemTask`). Pour services simples (pas forfait), V2 pourrait avoir besoin d'un champ `done: boolean` direct. |
| `BDCServiceItem.status: string` | `BdcItem.statusText` | ✅ ajouté Sprint 1 |
| `BDCServiceItem.prix` | `BdcItem.unitPriceSnapshot` | ✅ |
| `BDCServiceItem.subStates: boolean[]` (v1.0.7+) | `BdcItem.tasks[]` (BdcItemTask: TODO/DONE/SKIPPED) | ✅ V2 plus riche que V1. Mapping import : pour chaque `subStates[i] === true` → tâche correspondante en `DONE`. À vérifier dans `transformBdcs`. |
| `BDCPieceItem.nom` | `BdcItem.labelSnapshot` | ✅ |
| `BDCPieceItem.prix` | `BdcItem.unitPriceSnapshot` | ✅ |
| `BDCPieceItem.cmd: '...' \| '—' \| '√' \| '$' \| '#' \| '@'` | `BdcItem.cmdStatus: BdcPieceCmdStatus` | ✅ ajouté Sprint 1 (`LISTEE \| ESTIMEE \| A_COMMANDER \| EN_COMMANDE \| RECU_PARTIEL \| RECUE`) + CHECK constraint `cmdStatus IS NULL OR kind='PIECE'`. UI à brancher Sprint 2. |
| `BDCPieceItem.qte` | `BdcItem.qty` | ✅ |
| `BDCPieceItem.sousTotal` | `BdcItem.total` | ✅ |
| `BDCPieceItem.flag` | (abandonné) | ➖ V1 (col V) — drapeau visuel marginal en pratique, **décision** : ne pas porter (cf v1-reference §a). |
| `BDCPieceItem.cmdNote: string` (col W) | `BdcItem.cmdNote` | ✅ ajouté Sprint 1 |

**Actions BdcItem** :
- ✅ [P1 Sprint 1] cmdStatus enum + CHECK constraint
- ✅ [P1 Sprint 1] cmdNote ajouté
- ✅ [P1 Sprint 1] statusText ajouté
- 🟡 [Sprint 2] Brancher UI : dropdown cmdStatus + textarea cmdNote sur items pièces
- 🟢 [P3] Vérifier que l'import gère bien `subStates` → `BdcItemTask.status='DONE'`

### 1.6 Piece (catalogue) — DRIFTS notables

| V1 (col Sheets) | V2 | Statut |
|---|---|---|
| `pieceId` (col A, P00001…) | `Piece.legacyCode` | ✅ |
| `flag: '—' \| '√' \| '$' \| '@' \| '...'` (col B) | ❌ **MANQUE** | 🟡 [P2] À ajouter. C'est un statut visuel (—=neuf, √=disponible, $=à commander). Peu critique en V2 où on a `stockPhysique`. |
| `groupe` | (manque) | 🟡 [P2] V1 catégorise les pièces. V2 a `categorie` mais pas `groupe`. À voir l'usage dans v1. |
| `nom` | `Piece.nomCanonical` | ✅ |
| `sku` (col S, texte) | `Piece.sku` | ✅ |
| `skuUrl` (col S, hyperlien) | (manque) | 🟢 [P3] hyperlien fournisseur. Petit. |
| `prixAchat` (col L) | `Piece.prixAchat` | ✅ |
| `prixBase` (col O) | `Piece.prixBase` | ✅ |
| `prixVente` (col P) | `Piece.prixVente` | ✅ |
| `prixCost` (col Q) | `Piece.prixCost` | ✅ |
| `prixBDC` (col R) | `Piece.prixBdc` | ✅ |
| `fournisseur` (col U) | `Piece.fournisseur` | ✅ |
| `oos` (col V) | ❌ **MANQUE** | 🟡 [P2] compteur "out of stock". V2 calcule depuis stockPhysique. À supprimer ou recalculer. |
| `qteACommander` (col W) | ❌ **MANQUE** | 🟡 [P2] champ utilitaire. V2 peut le calculer dynamiquement. |
| `sousTotal` (col X) | (calculé) | ✅ |
| `categorie` (col AA) | `Piece.categorie` | ✅ |
| `stock` (col AB) | `Piece.stockPhysique` | ✅ source = StockMovement |
| `stockReserve` (col AC) | `Piece.stockReserve` | ✅ |
| **`surplus` (col AD)** | ❌ **MANQUE** | 🟠 [P2] qté en surplus à la réception PO (qteRecue > qteCommandee). À ajouter ou tracker via StockMovement type=`PO_RECEIVED` avec note `surplus`. |
| `notes` (col AE) | (manque, mais on a `legacyRawV1`) | 🟡 [P2] À ajouter `Piece.notes`. |
| `codeBarre` (col T) | `Piece.codeBarre` | ✅ |

**Actions Piece** :
- 🟠 [P2] Ajouter `Piece.surplus: Int` (ou tracker via StockMovement)
- 🟡 [P2] Ajouter `Piece.notes: String?`
- 🟢 [P3] Ajouter `Piece.flag, groupe, skuUrl` si l'usage le justifie

### 1.7 Service / Forfait

| V1 (Service unifié) | V2 (Service + Forfait séparés) | Statut |
|---|---|---|
| `Service.serviceId` | `Service.legacyCode` ou `Forfait.legacyCode` | ✅ |
| `Service.label` | `Service.nomCanonical` ou `Forfait.labelCanonical` | ✅ |
| `Service.duree` (texte "15 min", "1h30") | `Forfait.dureeMinutes: Int?` | 🔁 V2 plus structuré, parser nécessaire ("1h30" → 90) |
| `Service.categorie` | `Service.categorie` | ✅ |
| `Service.prix` | `Service.prix` ou `Forfait.prix` | ✅ |
| `Service.categoriePrio` | (manque) | 🟡 [P2] catégorie d'affichage prioritaire. À ajouter. |
| `Service.categorieAffichee` (calculé) | (calculé côté UI) | ✅ |
| (pas en V1) | `Forfait.taskTemplates: ForfaitTaskTemplate[]` | ➕ V2 plus structuré pour forfaits |

**Actions Service/Forfait** :
- 🟡 [P2] Ajouter `Service.categoriePrio: String?`
- 🟢 [P3] Vérifier que l'import des forfaits matche bien les tâches templates

### 1.8 Marque

| V1 | V2 | Statut |
|---|---|---|
| `nom` | `Marque.nom` | ✅ |
| (pas en V1, lu depuis `_PARAMÈTRES_`) | `Marque.taillesDisponibles: Json?` | ➕ ajouté V2 — à hydrater depuis export 1.1.0 clé `tailles` |

**Action** : aucune. Attendre export 1.1.0.

### 1.9 EquipeMember

| V1 | V2 | Statut |
|---|---|---|
| `prenom, nom, surnom` | `EquipeMember.prenom, nom, surnom` | ✅ |
| `courriel, tel, indicatif` | idem | ✅ |
| `lang: 'FR' \| 'EN'` | `EquipeMember.lang: VarChar(10)` | 🔁 mapping `FR` → `fr-CA` |
| `role` | `EquipeMember.role` | ✅ |
| `active: boolean` (parser tolérant) | `EquipeMember.active: Boolean` | 🔁 coercion à l'import |
| `notes` | `EquipeMember.notes` | ✅ |

**Action** : vérifier que l'import coerce bien `'oui'/'non'/'vrai'/'faux'/'true'/'false'/1/0`.

### 1.10 Vente / VenteDirecte

| V1 | V2 | Statut |
|---|---|---|
| `venteId` (timestamp) | `VenteDirecte.id` | 🔁 timestamp → ULID |
| `date` (ISO) | `VenteDirecte.date` | ✅ |
| `client` (texte) | `VenteDirecte.clientId?` | 🔁 résolution texte → ID, ou null (walk-in) |
| `items[]` | `VenteDirecte.items: VenteDirecteItem[]` | ✅ |
| `total` | `VenteDirecte.totalPieces` | ✅ |
| `factureNumero` | `VenteDirecte.factureNumero` | ✅ |
| `factureDate` | `VenteDirecte.factureDate` | ✅ |
| **`factureUrl`** (webViewLink Drive) | ❌ **MANQUE** | 🟢 [P3] V2 génère le PDF à la demande, donc URL non pertinent. Ignorable. |
| **`cost: boolean`** (col L _VENTES_) | ❌ **MANQUE** | 🟢 [P3] flag indiquant si prix COST utilisés. À ajouter `VenteDirecte.useCostPrices: Boolean` si besoin de retracer. |
| `remiseType, remiseValue` | `VenteDirecte.remiseType, remiseValue` | ✅ |

**Actions** : aucune action P1/P2.

### 1.11 PO / PoItem

| V1 | V2 | Statut |
|---|---|---|
| `poNumber` | `Po.poNumero` | ✅ |
| `fournisseur, dateCommande, dateReception, status, items[]` | `Po.*` | ✅ |
| `POLineItem.nom` | `PoItem.nomSnapshot` | ✅ |
| `POLineItem.sku` | `PoItem.skuSnapshot` | ✅ |
| `POLineItem.qteCommandee, qteRecue` | `PoItem.qtyCommandee, qtyRecue` | ✅ |
| `POLineItem.prixAchat` | `PoItem.unitPrice` | ✅ |
| `POLineItem.recu: boolean` | (calculé : `qtyRecue >= qtyCommandee`) | ✅ |
| `POLineItem.pieceId` | `PoItem.pieceId` | ✅ |
| **`POLineItem.notes`** | ❌ **MANQUE** | 🟡 [P2] À ajouter `PoItem.notes: String?`. |
| **`POLineItem.categorie`** (auto-création pièce) | ❌ **MANQUE** | 🟡 [P2] À ajouter pour le workflow ADHOC. |

**Action** : ajouter `PoItem.notes` + `PoItem.categorie` quand on portera les routes ADHOC.

### 1.12 FactureLog

V2 a une table unique pour les 3 sources V1 (BDT, ventes directes, legacy) — bonne unification.

| V1 (3 onglets) | V2 (`FactureLog`) | Statut |
|---|---|---|
| `ENCAISSE BDT` | `FactureLog where type=BDC` | ✅ |
| `VENTES` | `FactureLog where type=VENTE_DIRECTE` | ✅ |
| `FACTURES` (legacy mixte) | `FactureLog where type=LEGACY` | ✅ |
| `factureNumero` (3 formats : `F2026-0001` / `2026-0001` / `42`) | `FactureLog.factureNumero` | ✅ + parser tolérant à l'import |
| (statut PAYÉ + mode paiement, via route `/api/factures/log-status`) | `FactureLog.statut + modePaiement` | ✅ |

---

## 2. Routes API — inventaire 76 routes V1

### 2.1 Routes V2 existantes (matching V1)

| V1 | V2 | Statut |
|---|---|---|
| `/api/admin/export-v1` | (pas applicable côté V2) | — |
| `/api/admin/snapshot` | `/api/admin/snapshot` (route Next.js) + bouton sur `/admin/maintenance` | ✅ Sprint 2.9 |
| `/api/bdc` (CRUD) | server actions /admin/bdcs | ✅ |
| `/api/bdc/[id]/evaluation` (PDF + email draft) | `/api/admin/bdcs/[id]/eval.pdf` + `email-actions.sendEvalEmailAction` | ✅ |
| `/api/bdc/[id]/facturer` | `email-actions.sendFactureEmailAction` (BDC) + `/api/admin/factures/[id]/pdf` | ✅ partiel |
| `/api/bdc/[id]/avance` | ❌ **MANQUE** | 🔴 [P1] Acompte — voir 1.4 |
| `/api/bdc/[id]/items` | server actions BDT | ✅ |
| `/api/bdc/[id]/note` | server actions BDT | ✅ |
| `/api/bdc/[id]/remises` | (en édition BDT direct) | ✅ partiel |
| `/api/bdc/[id]/archiver` | server action | ✅ |
| `/api/bdc/[id]/suivi-courriel` | `sendSuiviEmailAction` + bouton sur fiche BDT | ✅ Sprint 2.5 |
| `/api/clients` (CRUD) | server actions /admin/clients | ✅ |
| `/api/clients/[nom]/velos` | (relation Prisma direct) | ✅ |
| `/api/clients/photos` | ❌ | 🟡 [P2] Photos clients — Vercel Blob à brancher |
| `/api/clients/sync-contacts` | (abandonné V2) | ➖ |
| `/api/inventaire` (CRUD vélos) | server actions /admin/velos | ✅ |
| `/api/inventaire/[id]/photos` | ❌ | 🟡 [P2] Photos vélo — Vercel Blob |
| `/api/inventaire/sync` | (abandonné — v2 native) | ➖ |
| `/api/catalogue/pieces, services, marques` (CRUD) | server actions /admin/pieces, services, marques | ✅ |
| `/api/catalogue/categories` | (calculé via Piece.categorie distinct) | ✅ |
| `/api/catalogue/export` | `/api/admin/export/pieces` | ✅ |
| `/api/catalogue/export/labels` | ❌ | 🟢 [P3] Étiquettes imprimables avec code-barre |
| `/api/catalogue/pieces/import-brompton` | ❌ | 🟢 [P3] Import xlsx Brompton spécifique. Couvert par import CSV générique V2 ? |
| `/api/po` (CRUD) + `/api/po/[poNumber]/finalize` | server actions /admin/pos | ✅ partiel (finalize = recevoir, déjà fait via `receivePoAction`) |
| **`/api/po/adhoc-receive`** | `createAdhocPoAction` + UI `/admin/pos/adhoc` | ✅ Sprint 2.6 |
| **`/api/po/[poNumber]/merge-adhoc`** | ❌ | 🟢 [P3] Fusion PO ADHOC dans PO cible — pas implémenté (peu de demande pratique). À faire si besoin se présente. |
| `/api/po/[poNumber]/sync-stock` | (StockMovement automatique sur reception) | ✅ |
| `/api/po/import` | `/api/admin/import-v1` (couvre la migration) | ✅ initial |
| `/api/ventes` (CRUD) + `/api/ventes/[id]/items` + `/api/ventes/[id]/facture` + `/api/ventes/[id]/archive` | server actions /admin/ventes | ✅ |
| `/api/factures/log-status` | server action `setFactureStatutAction` + UI `FactureStatutControls` | ✅ Sprint 2.4 |
| `/api/parametres/emails` | UI /admin/settings/email-templates | ✅ |
| `/api/parametres/equipe` | server actions /admin/equipe | ✅ |
| `/api/health/google` | (abandonné V2) | ➖ |
| `/api/cache/refresh` | (DB transactions, pas de cache) | ➖ |
| `/api/sync` | (abandonné) | ➖ |
| `/api/square/*` | (abandonné V2) | ➖ |
| `/api/admin/repair-bdt/[id]`, `cleanup-test-ventes`, `cleanup-vente-numbers`, `restore-bdc`, `test-cycle`, `test-stock` | `/admin/maintenance` (page UI) | 🟡 [P2] partiel — manquent test-cycle / test-stock comme commandes admin debug |
| `/api/archives` (lecture archives) | (Bdc.archiveStatus filter) | ✅ |
| `/api/archives/export` | `/api/admin/export/bdcs?archive=true` à ajouter | 🟢 [P3] |
| `/api/bdc-backups` | (legacy GAS) | ➖ |
| `/api/commandes` / `/api/commande/export` | `/api/admin/export/pos` | ✅ |
| `/auth/[...nextauth]` | Clerk middleware | ✅ |

### 2.2 Bilan routes

- **Existantes** : 61 / 76 (80 %) — +5 routes vs audit initial (log-status, snapshot, suivi-courriel, adhoc-receive, refresh partiel)
- **À porter P2 (important)** : 1 (photos clients/vélo — débloqué côté config, à coder)
- **À porter P3 (cosmétique)** : 4 (merge-adhoc, export labels, archives export, import-brompton)
- **Délibérément abandonnées** : 8 (Square, Google sync, sheets cache, etc.)

---

## 3. Code portable tel quel V1 → V2

À copier-coller depuis V1 quand on aura accès :

| V1 | V2 chemin cible | Statut V2 |
|---|---|---|
| `lib/finances/taxes.ts → computeTaxes` | `src/lib/billing/quebec-taxes.ts` (`calcQuebecTaxes`) | ✅ déjà porté, équivalent |
| `lib/sheets/counter.ts → parseFactureNumero` (3 formats) | `src/lib/import/parse-facture-numero.ts` | ✅ déjà porté |
| `lib/sheets/bdc-filters.ts → filterServiceItems` | (à créer si besoin) | 🟡 |
| `lib/utils/format.ts → stripMarkdownLink` | `src/lib/normalize/strip-markdown-email.ts` | ✅ déjà porté |
| `lib/utils/format.ts → parseSheetsDate, sheetsSerialToDateStr` | `src/lib/normalize/parse-v1-date.ts`, `parse-excel-serial.ts` | ✅ déjà porté |
| `lib/sheets/reservation.ts → _computeFromSource` | `src/app/[locale]/admin/maintenance/actions.ts → recomputeStockAction` | ✅ équivalent |

V2 est en avance ou à parité sur tout le code "métier portable". Bonne nouvelle.

---

## 4. Anomalies V1 documentées (à appliquer à l'import)

| V1 anomalie | Statut V2 |
|---|---|
| `pieceId` dupliqués (P00004 ×3, etc.) | À vérifier dans `transform/transform-pieces.ts` — déduplication par `(sku, nom)` ou nouveau ULID |
| Courriels Markdown résiduels | ✅ `stripMarkdownLink` appliqué |
| Dates Excel serial mixtes | ✅ `parseExcelSerial` + `parseV1Date` appliqués |
| `equipe.active` parser tolérant | ✅ Sprint 1 — `parseActive` enrichi (oui/non/yes/no/y/n/1/0/vrai/faux/true/false) |
| Marques pollution legacy | ✅ V2 a une table propre |

---

## 5. Préférences user transversales — portées dans CLAUDE.md

(D'après section 15 du `v1-reference.md`)

- ✅ Communiquer en français
- ✅ Pas de validation émotionnelle
- ✅ Valider la cause avant la solution
- ✅ Bump auto APP_VERSION quand l'utilisateur mentionne un numéro de version (mécanisme à mettre en place quand pertinent en V2)
- ✅ Push auto sur la branche de travail accepté (sauf opérations destructives)
- ✅ Préparer blob de reprise détaillé avant compaction

---

## 6. Plan d'action priorisé

### Sprint 1 — corrections de drift (P1, ~8h) — ✅ LIVRÉ 2026-05-08

1. ✅ **Aligner `BdcEvalStatus`** — `INDECIS` ajouté, `EN_ATTENTE` renommé `ATTENTE`. Back-compat `'' && checkOk → APPROUVE` codée dans `mapEvalStatus(raw, checkOk)`. Tests à jour (transform-bdcs.test).
2. ✅ **`Bdc.avance{Montant,Mode,Note}`** — 3 colonnes Postgres + enum `AvanceMode (COMPTANT|INTERAC|CARTES)`. UI BDT à brancher en Sprint 2.
3. ✅ **`BdcItem.cmdStatus` + `cmdNote` + `statusText`** — enum `BdcPieceCmdStatus (LISTEE|ESTIMEE|A_COMMANDER|EN_COMMANDE|RECU_PARTIEL|RECUE)`. Constraint CHECK `cmdStatus IS NULL OR kind='PIECE'`. UI à brancher en Sprint 2.
4. ✅ **Notes client `Velo → Bdc`** — `Bdc.noteClientEval/Facture` ajoutés. Migration SQL copie depuis Velo pour BDT actifs uniquement. Velo.note_client_* gardé deprecated le temps de la transition.
5. ✅ **CLAUDE.md** — préférences transversales (pas de validation émotionnelle, valider cause avant solution, push auto, blob de reprise, bump APP_VERSION).
6. ✅ **`parseActive`** enrichi (oui/non/yes/no/y/n/1/0/vrai/faux/true/false).
7. ✅ **`src/lib/velo/status-labels.ts`** — labels FR/EN + couleurs V1 pour VeloStatus + BdcEvalStatus. Appliqué sur listes vélos + BDT + dashboard + détail vélo.

### Sprint 2 — fonctions manquantes importantes (P2, ~15h) — partiellement livré

- ✅ **2.1 + 2.2 + 2.3 — Brancher UI nouvelles colonnes Sprint 1** : champs avance dans BDT (workflow-form), composant `PieceCmdEditor` inline sur items pièces (badge + popup), notes client lues depuis Bdc dans PDFs eval/facture + courriels (snapshot facture immutable).
- ✅ **2.4 — `setFactureStatutAction`** — facture statut PAYE/EMIS/ANNULE + mode paiement. UI `FactureStatutControls` (badge cliquable + popup) sur page client.
- ✅ **2.5 — Courriel de suivi post-livraison** — `Bdc.cbSuiviEnvoye` + `EmailKind.BDT_SUIVI` + `suiviEmailTemplate` + bouton EmailButtons.
- ✅ **2.6 — PO ADHOC** — création + réception en 1 étape. `Po.isAdhoc` + `PoItem.categorie/notes`. `createAdhocPoAction` (auto-création Piece, StockMovement immédiat). UI `/admin/pos/adhoc` multi-items.
- ✅ **2.9 — `/api/admin/snapshot`** — backup JSON 22 tables, depuis `/admin/maintenance`.
- ✅ **2.7 — Couche Gmail draft hybride** — livré 2026-05-09. OAuth flow + lib gmail-draft + email-actions hybrides + UI EmailButtons toggle + UI Settings panel.
- ⏸️ **2.8 — Photos clients + vélo (Vercel Blob)** — bloqué : nécessite token `BLOB_READ_WRITE_TOKEN` côté Vercel env. À débloquer manuellement avant code.
- ✅ **2.10 — Drop `Velo.noteClientEval/Facture` deprecated** — migration SQL avec copie Velo→Bdc le plus récent (incluant BDT archivés) avant DROP COLUMN. Schema/transforms/page vélo nettoyés.

### Bonus livrés Sprint 2 (hors plan initial)

- ✅ **Schema export V1 1.1.0** — `transform-templates.ts` + ajout `dump.tailles` répliqué sur marques + `dump.parametres` dans `legacyV1Extras`.
- ✅ **Refresh partiel** (`refreshFromDumpAction`) — re-import 1.1.0 sans recréer le workshop.
- ✅ **Templates multi-locale FR/EN** — UI onglets, fragments granulaires, signatures par lead.

### Sprint 3 — finitions (P3) — ✅ LIVRÉ 2026-05-08

13. ✅ **Champs Piece** : `notes` + `groupe` ajoutés (V1 col AE + sous-classification). UI + action.
14. ✅ **`Service.categoriePrio`** : déjà présent dans le schema initial.
15. ✅ **PoItem.notes / categorie** : déjà livré en Sprint 2.6 (PO ADHOC).
16. ✅ **`/api/catalogue/export/labels`** : page HTML A4 imprimable avec code-barre Code 128 SVG via bwip-js, 65 étiquettes/page (5×13), filtres URL, bouton sur `/admin/pieces`.

### En attente

- ✅ ~~**Schema export V1 1.1.0**~~ — livré côté V1 (commit dcf3848) et hydraté côté V2 via refresh partiel.
- **Design system V1** (zip Claude Design ou repo flex-rev-app) — pour appliquer le look jaune/dark au lieu du styling inline actuel. Toujours en attente.
- ✅ ~~**OAuth Google** côté Vercel~~ — débloqué 2026-05-09 (client OAuth Flex créé sur projet GCP `flex-rev`, env vars GOOGLE_CLIENT_ID/SECRET/SCOPES injectées sur Vercel prod+preview+dev). Sprint 2.7 livré.
- **Vercel Blob token** côté env Vercel — pour Sprint 2.8 (photos).

---

### Sprint 4 — Port UI/UX V1 (P1 visuel) — ✅ PLAN VALIDÉ V1+V2 (2026-05-10)

**Contexte** : V2 fonctionnellement à parité (Sprints 1+2+3 livrés), styling
encore inline / ad-hoc. Sprint 4 = porter le **look & feel V1** fidèlement,
sans toucher à la logique métier ni introduire de variantes V2 silencieuses.

**Critère de réussite** : visuellement reconnaissable par yako-san comme
« la même app que V1 ». Pas pixel-perfect. 6 screenshots V1 + section 0.1
mega-bundle = source de vérité visuelle. `v1-ui-bundle.md` section 10 =
checklist.

**Philosophie validée** : port fidèle V1 ; toute « amélioration V2 » que je
voudrais conserver doit être **listée explicitement et validée par yako-san
avant code**. Les itérations UI/UX agent dédié = Sprint 4.5+ après livrable.

**Hors scope** : refonte DB, nouveaux écrans, nouvelles features.

#### Stack UI retenue

- **Tailwind CSS v4** (à installer — V2 actuelle n'a PAS Tailwind, c'est du
  `style={{...}}` inline pur).
- **shadcn/ui** : CLI qui copie les composants dans `src/components/ui/` —
  on possède le code, on restyle agressivement vers palette V1 dès le début.
  Pas de look « shadcn par défaut » nulle part dans l'app finale.
- **Radix UI primitives** (sous le capot de shadcn) pour accessibilité.
- **lucide-react** (écosystème natif shadcn) — pas Heroicons. Mapping V1
  → Lucide ci-dessous (sémantique conservée).
- **Pas de CSS modules** — 100% Tailwind + tokens CSS variables.

#### Tokens couleurs V1 (à poser dans `globals.css` Phase 1)

```css
:root {
  /* Palette signature */
  --jaune:     #fff056;
  --jaune-h:   #e6d84e;  /* hover */
  --rouge:     #d92020;
  --rouge-h:   #b81818;
  --gris-bg:   #757575;  /* PageHeader */

  /* Statuts vélo — bg / fg */
  --st-rv-bg:         #fff056;  --st-rv-fg:         #000000;
  --st-recu-bg:       #fff056;  --st-recu-fg:       #000000;
  --st-eval-bg:       #88fa4e;  --st-eval-fg:       #000000;
  --st-attente-bg:    #fb923c;  --st-attente-fg:    #000000;
  --st-approuve-bg:   #62e335;  --st-approuve-fg:   #000000;
  --st-on-bench-bg:   #5cd62b;  --st-on-bench-fg:   #000000;
  --st-ctrl-qlte-bg:  #2e7d32;  --st-ctrl-qlte-fg:  #ffffff;
  --st-fini-bg:       #fce4ec;  --st-fini-fg:       #c62828;
  --st-facturer-bg:   #e53935;  --st-facturer-fg:   #ffffff;
  --st-facture-bg:    #ffcdd2;  --st-facture-fg:    #b71c1c;
  --st-livre-bg:      #e0e0e0;  --st-livre-fg:      #333333;

  /* Statuts pièces (cmd) — bg / fg */
  --cmd-listee-bg:    #ffffff;  --cmd-listee-fg:    #000000;
  --cmd-estimee-bg:   #ffcfc9;  --cmd-estimee-fg:   #b10202;
  --cmd-a-cmder-bg:   #d4edbc;  --cmd-a-cmder-fg:   #11734b;
  --cmd-en-cmde-bg:   #ffff00;  --cmd-en-cmde-fg:   #473821;  /* JAUNE PUR, pas signature */
  --cmd-recu-part-bg: #ffe0b2;  --cmd-recu-part-fg: #e65100;
  --cmd-recue-bg:     #00ff00;  --cmd-recue-fg:     #000000;

  /* Étapes mécaniciens */
  --etape-eval-bg:    #d9ead3;  --etape-eval-fg:    #38761d;
  --etape-meca-bg:    #b6d7a8;  --etape-meca-fg:    #38761d;
  --etape-ctrl-bg:    #93c47d;  --etape-ctrl-fg:    #274e13;

  /* Alpha / overlays V1 (boîtes sombres + listes alternées + texte secondaire) */
  --overlay-dark-20: rgba(0,0,0,0.20);    /* ToolbarBlock, pill total */
  --overlay-light-50: rgba(255,255,255,0.50);
  --overlay-light-70: rgba(255,255,255,0.70);
  --overlay-light-85: rgba(255,255,255,0.85);
  --text-secondary-50: rgba(0,0,0,0.50);
  --text-secondary-60: rgba(0,0,0,0.60);
  --text-secondary-70: rgba(0,0,0,0.70);

  /* Hiérarchie typo */
  --h1-size: 3.0rem;   --h1-weight: 400;  /* Helvetica Thin */
  --h2-size: 1.8rem;   --h2-weight: 900;
  --h3-size: 1.3rem;   --h3-weight: 600;
  --h4-size: 0.9rem;   --h4-weight: 900;  /* uppercase tracking 0.1em */
  --h5-size: 0.65rem;  --h5-weight: 600;
  --h6-size: 0.5rem;   --h6-weight: 600;
  --th-size: 11px;     --th-weight: 600;  /* lowercase */
}
```

**Note multi-tenant** : ces tokens passeront en `Workshop.theme` (JSONB DB)
+ éditeur UI `/admin/settings/theme` — différé en **Sprint 4.5** (hors
scope Sprint 4). Phase 1 = valeurs en dur dans `globals.css`.

#### Mapping icônes V1 (Heroicons) → V2 (Lucide)

```
WrenchScrewdriverIcon     → Wrench
Cog6ToothIcon / Cog8ToothIcon → Cog / Settings
ClockIcon                 → Clock
BanknotesIcon             → Banknote
InboxArrowDownIcon        → PackageOpen / Inbox
ClipboardDocumentListIcon → ClipboardList
ChartBarSquareIcon        → LayoutDashboard
UserGroupIcon             → Users
ArchiveBoxIcon            → Archive
PlusIcon                  → Plus
QrCodeIcon                → QrCode
MagnifyingGlassIcon       → Search
Bars3Icon                 → Menu
```

#### Layout global

- **Desktop** : sidebar **latérale jaune verticale double-état** (collapsed
  60px par défaut, expanded 200px sur `/dashboard` ou hover-expand temporaire
  ailleurs). Logo Flex `F/V` + version + icônes + avatar Google bas (hover →
  signOut).
- **Mobile (iOS)** : sidebar collapse en **header horizontal** ; long-press
  version = signOut.
- Badges numériques sur icônes : BDT actifs vert, ventes non fact rouge,
  stock bas rouge.
- Main = card arrondie sur fond gris foncé, contenu sur fond clair.

#### Phase 0 — Setup (0.25 j)

- `npm install -D tailwindcss@^4 @tailwindcss/postcss postcss`
- Config `tailwind.config.ts` + `postcss.config.mjs`.
- `npx shadcn@latest init` → config tokens + base CSS.
- `npx shadcn@latest add button dialog dropdown-menu select popover tooltip input label badge separator scroll-area` → composants base posés dans `src/components/ui/`.
- `npm install lucide-react` (déjà dépendance shadcn).
- Restyle immédiat de chaque composant vers palette V1 (jaune/dark) avant
  utilisation.
- `globals.css` final avec tous les tokens ci-dessus.

#### Phase 1 — Infrastructure UI (1 j)

Composants génériques dans `src/components/ui/` :

- **`<Sidebar>`** : double-état collapsed (60px) / expanded (200px) ;
  expanded par défaut sur `/dashboard` uniquement, hover-expand ailleurs ;
  icônes Lucide ; état actif souligné jaune ; badges compteur ; avatar bas
  hover → signOut ; long-press version mobile = signOut.
- **`<PageHeader>`** sticky : sur-titre gris (`vélos en atelier`) + titre H1
  grand thin + tooltip `?` + zone droite (UtilButtons ronds + AddButton
  jaune `+`).
- **`<Modal>`** (wrapper shadcn Dialog) : overlay `--overlay-dark-20`,
  carte centrée, escape + click-outside.
- **`<Pill>`** : badge statut variants `rv | recu | eval | attente |
  approuve | on-bench | ctrl-qlte | fini | facturer | facture | livre |
  staff | neutral` (couleurs alignées V1).
- **`<PillsToggle>`** *(ajout V1.B)* : composant générique de tabs
  (CLIENT/VÉLO sur fiche BDT, Éval/Facture sur note client, ÉMIS/PAYÉ/
  ANNULÉ + Comptant/Interac/Cartes sur FactureStatusPanel).
- **`<AddButton>`** (37×37 rond jaune) + **`<UtilButton>`** (32×32 rond
  gris/jaune).
- **`<DataTable>`** : table sticky-header, hover, sections groupables.
- **`<RowGroup>`** : ligne séparation `NOUVEAU` / `WIP` / `FACTURÉ` /
  `STAFF` avec label gris small-caps.

**Livrable Phase 1** : composants dans `src/components/ui/` + page interne
**`/admin/_dev/ui-kit`** listant chaque composant avec ses variantes
côte à côte, pour QA visuel rapide en preview Vercel.

#### Phase 2 — Composants domaine (1 j)

Composants spécifiques métier dans `src/components/domain/` :

- **`<BDCHeader>`** : carte sticky `/admin/inventaire/[id]` — numéro BDT
  padé `0145` + n° vélo + client (lien) + marque/modèle/couleur + Pill
  éval + Pill archive + **dropdowns mécanos inline** (eval/meca/ctrl) +
  **checkboxes workflow** (Évaluation envoyée, OK, Bon de sortie, Archiver)
  avec transitions auto via `nextStatusOnAssign` *(précision V1.E)*.
- **`<BDCTotaux>`** : panneau totaux. Sous-total services / pièces, remises,
  TPS/TVQ, grand total monospace aligné droite. **Lien souligné « avance ? »
  intégré au pill total** *(précision V1.D)* → ouvre modal édition (montant
  + mode + note). Avance saisie → pill devient `avance : 50,00 $ · Interac`
  cliquable, total barré, **reste-à-payer en gros jaune**.
- **`<FactureStatusPanel>`** : encart facture émise (numéro, date, mode
  paiement, statut, lien PDF) avec PillsToggle ÉMIS/PAYÉ/ANNULÉ +
  Comptant/Interac/Cartes.
- **`<RemiseInput>`** : input combiné % / $ (toggle type + valeur).
- **`<PieceCmdEditor>`** : déjà livré Sprint 2.2 → restyler avec tokens
  cmd-* (badge sigle `…/—/√/$/#/@`).
- **`<AjoutItemsModal>`** *(ajout V1.C)* : modal Services + Pièces du BDT
  — toggle SERVICES/PIÈCES haut + filtre catégorie + liste cochable
  groupée par sous-catégorie. Pattern clé du flow BDT.
- **`<ArchiveChoiceDialog>` v1.0.19** *(ajout V1.C)* : 4 boutons
  (Comptant/Interac/Cartes/Refusé) qui en un clic marquent PAYÉ + mode +
  archivent. Code complet `v1-ui-bundle.md` section 5 — pas le redécouvrir.
- **`<ClientAutocomplete>`** : recherche live client (à conserver depuis
  V2, c'est une amélioration V2 → audit-listée pour validation yako-san).
- **`<VeloFormFields>`** : Marque (dropdown) + Modèle/Couleur (libres) +
  Taille (dropdown selon marque). Réutilisé `/inventaire/new` et
  `/velos/new`.
- **`<StatusBadgeRow>`** : ligne complète colorée selon statut (background
  ON BENCH vert, FACTURÉ rose, etc.).

**Livrable Phase 2** : composants ajoutés à la page ui-kit.

#### Phase 3 — Pages (1 j)

**Renommages slugs** :
- `/admin/bdcs` → **`/admin/inventaire`** (terminologie V1).
- `/admin/bdcs/[id]` → **`/admin/inventaire/[id]`**.
- `/admin/pos` → **`/admin/reception`** (= V1 `/catalogue/reception`).
- Ajout **`/admin/commandes`** (= V1 `/commandes`, liste/historique POs).

Ordre de port :

1. **`/admin/inventaire/[id]`** (PRIORITÉ — page la plus dense, plus gros
   impact visuel) : BDCHeader + BDCTotaux + FactureStatusPanel +
   AjoutItemsModal + ArchiveChoiceDialog + tableau items restylé.
2. **`/admin/inventaire`** *(remplace liste plate `/admin/bdcs`)* : vue
   groupée par sections **NOUVEAU / WIP / FACTURÉ / STAFF** avec couleurs
   de fond par statut, dropdowns inline, Pills colorées.
3. **`/admin/dashboard`** *(ajout V1.A)* : hub principal V1, 3 colonnes
   KPIs + sections : Rendez-vous Square 14j (badge NEW), BDT terminés,
   BDT à suivi, Pièces à commander, Dernières factures, Dernières ventes ;
   4 KPI cards (BDT actif, Stock à commander, Suivis, Revenus mois).
   Chaque section = composant `<Section>` icône + titre + compteur + liste
   scrollable + état vide *(précision V1.H)*.
4. **`/admin/menu`** *(ajout V1.A)* : big menu mobile iOS, 6 squircle
   cards 2×3.
5. **`/admin/inventaire/new`** : refonte selon spec V1 — **priorité
   « Nouveau Vélo »** (Marque + Modèle/Couleur + Taille), bouton secondaire
   « Vélo existant » qui ouvre Modal recherche. **Audit V2 → V1 préalable**
   avant code (Zod validation, useActionState, autocomplete, …) ; je liste
   à yako-san ce qui mérite d'être conservé.
6. **`/admin/velos`** + **`/admin/velos/[id]`** : PageHeader + table +
   carte détail (infos / BDT historiques / photos quand 2.8 livré).
7. **`/admin/clients`** + **`/admin/clients/[id]`**.
8. **`/admin/pieces`** + **`/admin/pieces/[id]`** : restyler. Le bouton
   étiquettes A4 reste (feature V2 conservée).
9. **`/admin/factures`**, **`/admin/ventes`**.
10. **`/admin/reception`** (= `/catalogue/reception` V1) +
    **`/admin/commandes`** : groupement par fournisseur, header jaune par
    groupe (nom + count + total), boutons EXPORT (gris) + TRANSFÉRER EN
    RÉCEPTION (noir) **par fournisseur** ; Pill statut `$` jaune dropdown
    par ligne ; badge OOS rouge ; stock vert ; stepper qté inline ;
    catégories dropdown ; tabs `catalogue | fournisseurs | commandes |
    réception`.
11. **`/admin/settings`**, **`/admin/import`**, **`/admin/maintenance`**,
    **`/admin/archives`**.

#### Phase 4 — Polish (0.5 j)

- Audit responsive iOS Safari spécifiquement (sidebar header mobile).
- Suppression des styles inline morts (`csvBtn`, `tableStyle`, `thStyle`,
  `tdStyle` répétés partout).
- Captures avant/après pour validation finale yako-san.
- Lighthouse / axe-core pour audit accessibilité (cible 90+).

#### Estimation totale : 3.75 j

- Phase 0 : 0.25 j (setup Tailwind + shadcn)
- Phase 1 : 1 j (infra UI + ui-kit)
- Phase 2 : 1 j (composants domaine)
- Phase 3 : 1 j (pages, +0.25j vu pages ajoutées dashboard/menu/reception)
- Phase 4 : 0.5 j

#### Décisions verrouillées

- ✅ Storybook interne `/admin/_dev/ui-kit` : OUI.
- ✅ Sidebar latérale jaune desktop / header collapse mobile iOS, double-état
  collapsed/expanded.
- ✅ shadcn/ui (= Tailwind + Radix) + restyle V1 agressif.
- ✅ Lucide pour icônes (cohérence shadcn ; sémantique V1 conservée via
  mapping).
- ✅ Refonte `/admin/inventaire/new` directe + audit V2 préalable à
  valider yako-san.
- ✅ Renommages slugs : bdcs→inventaire, pos→reception, +commandes,
  +dashboard, +menu, +archives.
- ✅ Ordre Phase 3 : inventaire/[id] → inventaire → dashboard → menu →
  new → reste.
- ⏸️ Éditeur tokens UI multi-tenant : Sprint 4.5 (hors scope Sprint 4).

#### Hors scope Sprint 4 → Sprint 4.5+

- Page `/admin/settings/theme` : éditeur color picker pour chaque token,
  persistance `Workshop.theme` JSONB, injection runtime via CSS variables
  data-attr.
- Itérations UI/UX agent dédié (post-livrable visuel V1 fidèle).

---

## 7. Différences délibérées V2 vs V1 (à conserver)

À NE PAS porter — ces différences sont voulues :

- **Multi-tenant** : `workshop_id` partout, pas de mono-tenant `yako-cyclo` hardcodé
- **Postgres au lieu de Sheets** — perte du caractère "éditable manuellement" mais gain en intégrité
- **Clerk au lieu de NextAuth** — multi-tenant + organizations
- **next-intl FR + EN** au lieu de FR seul
- **Email hybride** : brouillon Gmail par défaut (pattern V1) + bouton secondaire « Envoyer maintenant » optionnel (envoi direct SMTP/Resend). **Phase 1 livrée** (envoi direct SMTP Gmail / Resend en place + multi-locale FR/EN + templates V1 hydratés via refresh 1.1.0). **Phase 2 bloquée** sur OAuth Google côté Vercel pour le mode brouillon Gmail (`gmail.compose` scope).
- **Sortie de Square** — réservations natives
- **shadcn/ui prévu** au lieu d'inline styles (pas encore appliqué — en attente Design System)

---

## 8. Mise à jour de ce document

À chaque batch de porting, mettre à jour :
- Statut des items (cocher / déclasser de "manque" à "fait")
- Date de dernière mise à jour en haut
- Section "anomalies remontées" si on en découvre

Le document doit rester la **source de vérité** de la parité V1↔V2 jusqu'à
ce que la V2 soit considérée à parité fonctionnelle (Sprint 1+2 terminés).
