# V1 ↔ V2 — audit de parité

**Source v1** : `yako-san/flex-rev-app` tag `v1.0.0` (commit `ef5e604`),
documenté dans `docs/v1-handoff/v1-reference.md` (à venir) ou récupéré
inline depuis la session v1.

**Cible v2** : `yako-san/flex` HEAD courant, schema Prisma 25 modèles.

**Date audit** : 2026-05-08, par session v2 (Opus 4.7 / 1M context).

**Statut** : audit initial — la v2 connaît maintenant la cible. À mettre
à jour à chaque correction/porting batch.

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

### 1.4 Bdc — DRIFT MAJEUR sur evalStatus

| V1 | V2 | Statut |
|---|---|---|
| `id` | `Bdc.id` | ✅ |
| `dateIn, dateOut` | `Bdc.createdAt, deletedAt` | 🔁 |
| `veloDesc, clientNom` | (relations) | ✅ |
| `noteClient` (col V GAP, éval) | (porté dans `Velo.noteClientEval`) | ⚠️ **mapping à vérifier** : V1 stocke sur BDC, V2 sur Velo. Si plusieurs BDT pour le même vélo, on perd la note historique. |
| `noteClientFacture` (col W GAP) | (porté dans `Velo.noteClientFacture`) | ⚠️ idem |
| `checkEval, checkOk, checkBds, checkOut` | `Bdc.cbEvalEnvoye, cbEval, cbBonSortie, cbArchiver` | ✅ |
| **`evalStatus: '' \| APPROUVE \| REDUX \| ATTENTE \| REFUSE`** | **`BdcEvalStatus: EN_ATTENTE \| APPROUVE \| REDUX \| REFUSE`** | ❌ **DRIFT** : (1) V2 ne représente pas la valeur vide `''` (= "indécis"), (2) V2 utilise `EN_ATTENTE` quand V1 utilise `ATTENTE`. **Action** : ajouter une valeur `INDECIS` à l'enum V2 OU passer `evalStatus` en nullable et traiter `null` comme indécis. Renommer `EN_ATTENTE` → `ATTENTE` pour conformité. |
| `archiveStatus` (lu depuis ARCHIVES col C) | `Bdc.archiveStatus: BdcArchiveStatus` | ✅ |
| `noteVelo` (copié de INVENTAIRE) | `Velo.noteVelo` | ✅ relation |
| `evalMecano, mecaMecano, ctrlMecano` | `Velo.*MecanoId` | ✅ relation |
| `noteInterne` (col W ARCHIVES) | `Bdc.notes` | ✅ |
| `remiseSvc: { type, value }` | `Bdc.remiseSvcType + remiseSvcValue` | ✅ |
| `remisePce: { type, value }` | `Bdc.remisePceType + remisePceValue` | ✅ |
| **`avance: { montant, mode, note }`** (v1.0.15+) | ❌ **MANQUE** | ❌ **À AJOUTER** : champs `Bdc.avanceMontant + avanceMode + avanceNote` (ou JSON). Mode = `comptant \| interac \| cartes`. Affecte le "reste à payer" affiché dans la facture (mais pas le calcul fiscal). Acompte versé par le client lors de l'éval. |
| `items[]` | `Bdc.items: BdcItem[]` | ✅ |
| `totalServices, totalPieces` | `Bdc.totalServices, totalPieces` | ✅ |

**Actions BDC** :
- 🔴 [P1] Aligner `BdcEvalStatus` enum sur V1 (renommer `EN_ATTENTE` → `ATTENTE`, ajouter `INDECIS` pour `''`)
- 🔴 [P1] Ajouter champ `avance` (montant + mode + note)
- 🟡 [P2] Décider si `noteClient` doit être par-BDC ou par-Velo (V1 par-BDC, V2 par-Velo). Si par-Velo, on perd le contexte multi-BDT.

### 1.5 BdcItem — gestion forfaits / pièces

| V1 (BDCServiceItem ∪ BDCPieceItem) | V2 (BdcItem unifié) | Statut |
|---|---|---|
| `BDCServiceItem.serviceId` | `BdcItem.serviceId` | ✅ |
| `BDCServiceItem.nom` | `BdcItem.labelSnapshot` | ✅ |
| `BDCServiceItem.fait: boolean` | `BdcItem.tasks[] (BdcItemTask)` ou tâche inline | 🔁 V1 = checkbox unique sur l'item ; V2 = sous-tâches (`BdcItemTask`). Pour services simples (pas forfait), V2 pourrait avoir besoin d'un champ `done: boolean` direct. |
| `BDCServiceItem.status: string` | (manque) | ❌ **MANQUE** : statut texte libre du service (ex "À refaire", "ok"). Petit, à ajouter en `BdcItem.statusText`. |
| `BDCServiceItem.prix` | `BdcItem.unitPriceSnapshot` | ✅ |
| **`BDCServiceItem.subStates: boolean[]`** (v1.0.7+) | `BdcItem.tasks[]` (BdcItemTask: TODO/DONE/SKIPPED) | ✅ V2 plus riche que V1. Mapping import : pour chaque `subStates[i] === true` → tâche correspondante en `DONE`. **À implémenter dans transformBdcs**. |
| `BDCPieceItem.nom` | `BdcItem.labelSnapshot` | ✅ |
| `BDCPieceItem.prix` | `BdcItem.unitPriceSnapshot` | ✅ |
| **`BDCPieceItem.cmd: '...' \| '—' \| '√' \| '$' \| '#' \| '@'`** | ❌ **MANQUE** | 🔴 **À AJOUTER** : enum `BdcPieceCmdStatus` (`LISTEE \| ESTIMEE \| A_COMMANDER \| EN_COMMANDE \| RECU_PARTIEL \| RECUE`) sur `BdcItem` quand `kind=PIECE`. Critique pour le workflow d'achat/réception. |
| `BDCPieceItem.qte` | `BdcItem.qty` | ✅ |
| `BDCPieceItem.sousTotal` | `BdcItem.total` | ✅ |
| `BDCPieceItem.flag` | (manque) | ⚠️ duplicate de `cmd` ? À vérifier. |
| **`BDCPieceItem.cmdNote: string`** (col W) | ❌ **MANQUE** | 🔴 **À AJOUTER** : `BdcItem.cmdNote: String?` — note libre de commande fournisseur (visible dans /admin/pos pour le commerçant). |

**Actions BdcItem** :
- 🔴 [P1] Ajouter enum + champ `cmdStatus` pour items pièces
- 🔴 [P1] Ajouter `cmdNote` pour items pièces
- 🟡 [P2] Ajouter `statusText` pour items services (petit)
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
| `/api/admin/snapshot` | ❌ | 🟡 [P2] Backup DB snapshot — à porter |
| `/api/bdc` (CRUD) | server actions /admin/bdcs | ✅ |
| `/api/bdc/[id]/evaluation` (PDF + email draft) | `/api/admin/bdcs/[id]/eval.pdf` + `email-actions.sendEvalEmailAction` | ✅ |
| `/api/bdc/[id]/facturer` | `email-actions.sendFactureEmailAction` (BDC) + `/api/admin/factures/[id]/pdf` | ✅ partiel |
| `/api/bdc/[id]/avance` | ❌ **MANQUE** | 🔴 [P1] Acompte — voir 1.4 |
| `/api/bdc/[id]/items` | server actions BDT | ✅ |
| `/api/bdc/[id]/note` | server actions BDT | ✅ |
| `/api/bdc/[id]/remises` | (en édition BDT direct) | ✅ partiel |
| `/api/bdc/[id]/archiver` | server action | ✅ |
| `/api/bdc/[id]/suivi-courriel` | ❌ | 🟡 [P2] Courriel de suivi (post-livraison) — template SMS_SUIVI déjà ajouté en V2, route à brancher |
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
| **`/api/po/adhoc-receive`** | ❌ **MANQUE** | 🟠 [P2] Création PO ADHOC depuis réception — workflow important |
| **`/api/po/[poNumber]/merge-adhoc`** | ❌ | 🟠 [P2] Fusion PO ADHOC dans PO cible |
| `/api/po/[poNumber]/sync-stock` | (StockMovement automatique sur reception) | ✅ |
| `/api/po/import` | `/api/admin/import-v1` (couvre la migration) | ✅ initial |
| `/api/ventes` (CRUD) + `/api/ventes/[id]/items` + `/api/ventes/[id]/facture` + `/api/ventes/[id]/archive` | server actions /admin/ventes | ✅ |
| `/api/factures/log-status` | ❌ | 🟠 [P2] Marquer facture comme PAYÉE + mode paiement — important pour suivi de caisse |
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

- **Existantes** : 56 / 76 (74 %)
- **À porter P1 (bloquant)** : 1 (`avance`)
- **À porter P2 (important)** : 8 (`adhoc-receive`, `merge-adhoc`, `log-status`, `snapshot`, photos clients, photos vélo, suivi-courriel, repair/test admin)
- **À porter P3 (cosmétique)** : 3 (export labels, archives export, import-brompton)
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
| `equipe.active` parser tolérant | ⚠️ à vérifier dans `transform/transform-equipe.ts` |
| Marques pollution legacy | ✅ V2 a une table propre |

---

## 5. Préférences user transversales — à porter dans CLAUDE.md

(D'après section 15 du `v1-reference.md`)

- ✅ Communiquer en français — déjà dans CLAUDE.md
- ❌ **Pas de validation émotionnelle** — à ajouter au CLAUDE.md
- ❌ **Valider la cause avant la solution** — à ajouter
- ❌ **Bump auto APP_VERSION** quand l'utilisateur mentionne un numéro de version — à ajouter (pas de mécanisme APP_VERSION en V2 pour l'instant)
- ❌ **Push auto sur main accepté** (commit + push direct sans demander) — à ajouter / clarifier
- ❌ **Préparer blob de reprise détaillé** avant compaction — à ajouter

**Action immédiate** : enrichir `CLAUDE.md`.

---

## 6. Plan d'action priorisé

### Sprint 1 — corrections de drift (P1, ~6h)

1. **Aligner `BdcEvalStatus`** — ajouter `INDECIS` ou nullable, renommer `EN_ATTENTE` → `ATTENTE`. Migration + script de back-compat (`'' && checkOk → APPROUVE`). [2h]

2. **Ajouter `Bdc.avance`** — colonnes `avanceMontant Decimal? / avanceMode enum / avanceNote String?`. Migration + UI dans BDT. [2h]

3. **Ajouter `BdcItem.cmdStatus` (pour pièces)** — enum `LISTEE/ESTIMEE/A_COMMANDER/EN_COMMANDE/RECU_PARTIEL/RECUE` + `BdcItem.cmdNote`. Migration + UI dans BDT. [2h]

4. **Mettre à jour CLAUDE.md** — préférences transversales (pas de validation émotionnelle, etc.). [10 min]

### Sprint 2 — fonctions manquantes importantes (P2, ~12h)

5. **`/api/po/adhoc-receive` + merge-adhoc** — workflow PO ADHOC. [4h]
6. **`/api/factures/log-status`** — marquer facture comme PAYÉE + mode paiement. [2h]
7. **`Bdc.suivi-courriel`** — courriel post-livraison (template SMS_SUIVI déjà prêt). [1h]
8. **Photos clients + vélo** (Vercel Blob). [3h]
9. **`/api/admin/snapshot`** — backup DB. [2h]

### Sprint 3 — finitions (P3, ~6h)

10. **Champs Piece manquants** (`flag, groupe, notes, surplus, skuUrl`). [2h]
11. **`Service.categoriePrio`**. [30 min]
12. **PoItem.notes / categorie**. [30 min]
13. **`/api/catalogue/export/labels`** — étiquettes imprimables avec code-barre. [3h]

### En attente

- **Schema export V1 1.1.0** (yako-san le demande à la session V1) — pour hydrater `Workshop.emailTemplates`, `Marque.taillesDisponibles`, `parametres`.
- **Design system V1** (zip Claude Design ou repo flex-rev-app) — pour appliquer le look jaune/dark au lieu du styling inline actuel.

---

## 7. Différences délibérées V2 vs V1 (à conserver)

À NE PAS porter — ces différences sont voulues :

- **Multi-tenant** : `workshop_id` partout, pas de mono-tenant `yako-cyclo` hardcodé
- **Postgres au lieu de Sheets** — perte du caractère "éditable manuellement" mais gain en intégrité
- **Clerk au lieu de NextAuth** — multi-tenant + organizations
- **next-intl FR + EN** au lieu de FR seul
- **Email envoi auto** au lieu de Gmail draft (changement de UX — à valider avec yako-san)
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
