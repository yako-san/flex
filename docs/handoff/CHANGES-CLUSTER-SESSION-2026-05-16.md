# Changements V1 — Session clusters 2026-05-16/17

> Session de patches itératifs livrés en autopilote sur le tag de travail
> `v1.3.0-preview` (post-v1.0.22). Toutes les modifs sont sur `main` du
> repo `yako-san/flex-rev-app`, PRs #5 à #9.
>
> **Pour V2** : ce document énumère les changements de modèle, de schéma
> sheet, et les patterns UX livrés en V1. Tout ce qui est métier doit être
> porté V2 dès que la fondation UI/CSS sera stable.

---

## Vue d'ensemble — 5 clusters couverts

| Cluster | Sujet | PRs main V1 |
|---|---|---|
| **1** | Rename pièce catalogue cassait le BDT (stock 0, perte du lien) | #4, #5 |
| **2** | Item à 0 stock physique mais réservé → display "(stock 0)" trompeur | #6 |
| **3** | 6 quick wins UI/UX divers (tri PO, ÉVAL, TTC, CC factures, etc.) | #1, #2, #3 |
| **4** | Workflows ventes : services, prix 0, marquer payée | #7, #8, #9 |
| **5p** | Apps Script `onEdit` "Authorization is required" x40 | étape manuelle |
| **5q** | Scan iOS Bluetooth → ordinateur hôte | choix matériel |

---

## Cluster 1 — pieceId stable pour items BDT

### Problème métier

Quand une pièce du catalogue était renommée (ex. correction d'orthographe,
mise à jour de description fournisseur), les BDT existants qui la
référençaient perdaient le lien : affichage `(stock 0)`, recalculs de
réservation incorrects, sync PO/BDT cassée.

**Cause racine** : `BDCPieceItem` stockait `nom: string` mais pas
`pieceId`. Tous les lookups catalogue → BDT passaient par le nom (chaîne
mutable). À comparer : `BDCServiceItem` avait déjà un `serviceId?: string`
(col I de BDC sheet).

### Phase A — fondation (PR #4)

**Schéma sheet `BONS DE COMMANDES`** :
- Col O = nouveau header `PCE_ID` (ID stable type `P00042…`)
- Col O était auparavant un trou inutilisé → aucun autre index décalé
- Header écrit manuellement par yako-san en cellule O1

**Code v1** (`lib/sheets/client.ts`, `lib/sheets/bdc.ts`, `types/bdc.ts`,
`components/bdc/PiecesPopup.tsx`) :
- `BDC_COL.PCE_ID = 15` ajouté
- `BDCPieceItem.pieceId?: string` ajouté à l'interface
- `AddPieceInput.pieceId?: string` (le caller `PiecesPopup` transmet
  maintenant `piece.pieceId` quand on ajoute une pièce au BDT)
- `insertPieces` écrit `r[BDC_COL.PCE_ID - 1] = item.pieceId ?? ''`
- `getBDC` lit `pieceId` depuis col O (undefined si vide → rétrocompat)

**Migration backfill** :
- Endpoint `POST /api/admin/migrate-bdc-pceid` (admin-only, idempotent)
- Parcourt toutes les lignes ITEM avec `nom` mais pas de `pieceId`,
  matche par nom normalisé → catalogue, écrit le pieceId
- Réponse : `{ totalItemRows, matched, unmatched, ambiguous, samples,
  updates[] }`
- Exécution prod : 34/45 matched automatiquement, 11 unmatched corrigés
  à la main par yako-san dans la sheet, re-run idempotent confirme 45/45

### Phase B — consumers (PR #5)

Tous les consumers qui faisaient un lookup catalogue par nom passent
maintenant par un helper unifié :

**Nouveau helper** `lib/utils/pieces.ts` :
```ts
export function pieceKey(piece: { pieceId?: string; nom: string }): string {
  if (piece.pieceId && piece.pieceId.trim() !== '') {
    return `id:${piece.pieceId.trim()}`;
  }
  return `nom:${normalizePieceName(piece.nom)}`;
}
```

Symétrique : producer (BDC item) et consumer (catalogue piece) appellent
la même fonction. La clé `id:P00042` survit aux renames ; le fallback
`nom:xxx` couvre les items pré-migration ou non matchés.

**Consumers refactorés** :
1. `lib/sheets/reservation.ts` — maps `engaged` et `reserved` keyées par
   `pieceKey`, `recomputeStockState` lit col A (pieceId) et utilise la
   même clé. Les ventes utilisaient déjà `pieceId` (VenteItem obligatoire).
2. `lib/sheets/po.ts` — `receivedKeys = new Set(pieceKey(item))` pour
   matcher BDT items reçus après livraison fournisseur.
3. `components/bdc/BDCPanel.tsx` — `stockMap`, `catalogRowMap`,
   `fournisseurMap` ajoutent une 3ᵉ clé `id:${pieceId}` en plus du nom
   raw + nom normalisé. Les lookups essaient idKey en premier, fallback
   nom existant.

### À porter V2

V2 Prisma a déjà un modèle relationnel propre — `BdcItem` doit avoir
`pieceId: string` (FK vers `Piece`) au lieu d'un nom. Côté UI, importer
la logique :
- Helper `pieceKey()` n'est pas nécessaire en V2 (Prisma fait le join
  via FK), mais le **principe** reste : ne jamais matcher par nom seul.
- Migration sheet v1 → Postgres v2 doit conserver le pieceId quand il
  est présent (col O de BDT).

---

## Cluster 2 — Stock réservé display

### Problème métier

Un item physiquement présent en atelier mais réservé par un BDT actif
affichait `(stock 0)` dans la cellule BDT — signal trompeur de rupture
alors que l'unité existe juste, commitée ailleurs.

### Fix (PR #6) — display only

`components/bdc/BDCPanel.tsx` :
- Nouveau `stockReserveMap` parallèle à `stockMap` (lit col AC catalogue)
- Logique d'affichage 3-niveaux :
  - `stock > 0` → `(stock N)` — N unités libres
  - `stock === 0 && reserve > 0` → `(réservé)` en bleu — toutes les
    unités sont commitées
  - `stock === 0 && reserve === 0` → `(stock 0)` — vraie rupture

Pas de changement de modèle, pas de migration. Le calcul AB/AC existant
reste source de vérité.

### Phase 2 (auto-release REDUX/REFUSÉ) — pas livré

Le pipeline existant (`safeRecomputeStockState` appelé par les routes
BDC `evaluation` / `archiver` / etc.) devrait déjà gérer la libération
de stock quand un BDT bascule en REDUX ou REFUSÉ (sortie de
`RESERVED_STATUSES`). À tester en prod avant de coder une phase 2.

### À porter V2

V2 a déjà le modèle `Piece.stockPhysique` / `stockReserve` (cf migration
v6.4.0). Le pattern d'affichage est juste UI :
- Composant qui affiche le stock d'une pièce dans le contexte d'un BDT
  doit suivre la même logique 3-niveaux.

---

## Cluster 3 — Quick wins UI/UX (6 items)

### Items livrés (PRs #1, #2, #3)

| Item | Fichier(s) | Change |
|---|---|---|
| **g** Tri PO récents en haut | `app/catalogue/reception/page.tsx` | `activePOs` et `historyPOs` triés par `dateCommande` desc |
| **h** ÉVAL en jaune top inventaire | `lib/utils/statuts.ts` + `components/inventaire/VeloTable.tsx` | Couleur ÉVAL passe de `#88fa4e` (vert) à `#fff056` (jaune). Set `NOUVEAU` étendu : `['RV', 'REÇU', 'ÉVAL.']` (était `['RV', 'REÇU']`). Set `WIP` réduit en conséquence. |
| **i** Checkbox commande | `app/catalogue/commande/page.tsx` | Filtre élargi : montre `flag === '√'` ET `'$'` (avant : seulement `'$'`). Cellule statut : dropdown 6-options remplacé par checkbox binaire √↔$. |
| **j** Header vente TTC | `app/catalogue/ventes/page.tsx` | `subtitleText` affiche maintenant HT et TTC côte à côte via `computeTaxes(totalVentes).grandTotal` |
| **k** Format bloc total BDT | `components/bdc/BDCTotaux.tsx` | Refonte du format : `Services X + Pièces Y = (X+Y) HT` à gauche, `total facture {TTC}` à droite (était total HT). Reste-à-payer calculé sur TTC. |
| **l** Retire CC `info@cycloflex.ca` | `lib/sheets/factures.ts` | Plus de copie automatique à la compta CycloFlex sur les factures envoyées |

### À porter V2

- **g, j, k** : sont des changements UI ciblés, à reproduire en V2 selon
  la même logique.
- **h** : V2 doit aligner la palette statuts dans son `globals.css` —
  ÉVAL devient jaune signature.
- **i** : V2 peut adopter directement le pattern checkbox au lieu du
  dropdown CMD si il porte cette page.
- **l** : simple — pas de CC sur les factures V2.

---

## Cluster 4 — Workflows ventes (3 items)

### Item m — Marquer vente payée (PR #9)

**Schéma sheet `_VENTES_`** :
- Col P = nouveau header `payeStatus` (texte `'payé'` ou vide)
- Col O `modePaiement` déjà existait depuis v7.0.22
- Header écrit manuellement par yako-san en cellule P1

**Code v1** :
- `types/vente.ts` : `payeStatus?: 'payé' | ''` + `modePaiement?` (déjà
  écrit en col O mais jamais lu — back-fillé maintenant)
- `lib/sheets/ventes.ts` :
  - Range read A2:N → **A2:P**
  - `VENTES_HEADERS` étendu à 16 entrées (init nouveaux onglets)
  - Nouvelle fonction `markVentePayee(venteId, paye: boolean)` — écrit
    `'payé'`/`''` en col P de la 1ʳᵉ ligne. Refuse si vente pas facturée.
- API : `POST /api/ventes/[venteId]/marquer-payee  body { paye: boolean }`
- Hook : `useVentes().markVentePayee()` optimiste avec rollback

**UI** (`app/catalogue/ventes/page.tsx`) :
- Nouveau bouton `CheckCircleIcon` dans les actions vente (mobile +
  desktop). Visible quand `isFact`. Toggle ON = vert `#16a34a`, titre
  "Annuler". Toggle OFF = sombre, titre "Marquer comme payée → archivable".
- Pill état 3-niveaux dans le header de chaque vente :
  - Pas facturée → jaune `#fff056`, "À facturer"
  - Facturée pas payée → blanc 50%, "Facture envoyée"
  - Payée → gris `#e0e0e0`, "Payé"
- Bouton archive (TrashIcon/ArchiveBoxArrowDown) :
  - Non facturée → supprime brouillon (inchangé)
  - Facturée payée → archive
  - Facturée pas payée → disabled + toast "Marquer comme payée avant
    d'archiver"

### Item n — Services dans picker "Ajouter à la vente" (PR #7)

**Problème** : "Ajouter à la vente" cherchait seulement dans le catalogue
PIÈCES. Pour ajouter un service à une vente existante, il fallait passer
par un BDT — friction inutile pour les ventes comptoir.

**Code v1** :
- `app/catalogue/ventes/page.tsx` :
  - Picker `appendFiltered` combine maintenant pièces + services (`useServices()`)
  - Chaque entrée normalisée en `PickerEntry { kind: 'piece' | 'service',
    pieceId, sku, nom, prix }`
  - Services stockés avec leur `serviceId` S-préfixé dans le champ
    `pieceId` (convention déjà reconnue par `preview-pdf` qui splitte
    par préfixe 'S')
  - Icônes préfixes : 🧰 service, ⚙️ pièce
- `lib/sheets/ventes.ts` :
  - `_adjustStock` skip explicite des items dont `pieceId.startsWith('S')`
  - Sécurise contre un match accidentel par nom qui décrémenterait le
    stock d'une pièce dont le nom égalerait celui d'un service

### Item o — Bouton 🆓 "inclus" prix 0 (PR #8)

**Use case** : "Urgence flat" — réparation crevaison comptoir, prix
forfaitaire fixe (30 $ TTC). On veut ajouter une ligne "Chambre à air"
au panier (pour décrémenter le stock) sans qu'elle s'ajoute au total
client. La chambre à air n'est PAS toujours le même modèle — le user
sélectionne manuellement via la recherche catalogue.

**Code v1** (`app/catalogue/ventes/page.tsx`) :
- Bouton `🆓` à côté du `PrixInput` sur chaque ligne d'item (new vente
  modal + append modal)
- Clic → `updateItem(i, { prixUnit: 0 })` en 1 tap
- Quand `prixUnit === 0` : icône opaque + s/total affiché "inclus" en
  italique grisé au lieu du montant
- Pour revenir au prix catalogue : retaper la valeur dans `PrixInput`
- Le stock reste décrémenté normalement (qte > 0 quelle que soit prixUnit)

**Workflow type "Urgence flat" en 4 taps** :
1. Nouvelle vente (Walk-in)
2. Service `🧰 Urgent. : Flat` → 30 $
3. Pièce `⚙️ Chambre à air <modèle exact>` → 13 $ catalogue
4. Clic 🆓 sur chambre à air → 0 $, total reste 30 $
5. Facturer → stock chambre à air -1, total facturé 30 $

### À porter V2

V2 a déjà le modèle ventes/services proprement séparés en Prisma. Les
patterns à adopter :
- Picker unifié dans `<AppendVenteModal>` qui accepte pièces ET services
- Bouton `🆓` ou similaire (toggle "inclus") sur les lignes d'item
- État `payeStatus` séparé de `factureDate` (en V2 c'est probablement
  un enum ou une date `paidAt`)
- Pill 3 états (à facturer / facturé / payé) avec palette signature

---

## Cluster 5p — Apps Script `onEdit` Authorization (étape manuelle)

**Symptôme** : Le sheet `FACTURES - FLEX-REV` accumule des erreurs
"Authorization is required to perform that action" sur le trigger
`onEdit` — 40 erreurs le 2026-05-14.

**Cause racine identifiée** :
La fonction `function onEdit(e)` (ligne 106 de `FACTURE et %` GAS
project) est un **simple trigger** Apps Script. Les simple triggers
ne peuvent PAS appeler :
- `LockService.getScriptLock()` (utilisé ligne 116)
- `PropertiesService.getScriptProperties()` (ligne 120)
- `UrlFetchApp`, `MailApp`, etc.

Les simple triggers ont des scopes d'autorisation restreints — seulement
lecture du spreadsheet + modifications via APIs basiques. Toute opération
qui demande consentement OAuth additionnel échoue.

**Fix à appliquer (manuel, par yako-san)** :
1. Ouvrir le GAS éditeur du projet "FACTURE et %"
2. Renommer `function onEdit(e)` ligne 106 → `function handleEdit(e)`
3. Sauvegarder
4. Dans la barre latérale du GAS éditeur, icône ⏰ horloge (Triggers)
5. Bouton `+ Add Trigger` :
   - Function to run : `handleEdit`
   - Event source : From spreadsheet
   - Event type : On edit
6. Save → consentement OAuth → accepter tous les scopes

Le trigger devient **installable** au lieu de simple → tourne avec les
permissions complètes de l'owner → plus d'erreur d'autorisation.

**Note** : la fonction `onOpen` (ligne 28) reste inchangée — elle ne
fait que `SpreadsheetApp.getUi().createMenu()` qui est dans le scope
des simple triggers.

### À porter V2

Non applicable directement — V2 utilise Postgres au lieu de Sheets, donc
pas de GAS triggers. Mais pattern à retenir si V2 réutilise un sheet
GAS (ex. archives, export) : toujours installable trigger pour toute
opération avec authorization.

---

## Cluster 5q — Scan iOS Bluetooth (choix matériel)

**Use case** : scanner code-barres en atelier (par exemple sur une boîte
ou un produit), transmettre le résultat à l'ordinateur hôte (Mac de caisse
qui run l'app FLEX).

**Choix yako-san : NETUM C750** — scanner Bluetooth hardware dédié
(~40$ CAD Amazon).
- Pair direct au Mac comme un clavier Bluetooth HID
- Pas d'app à installer côté iOS, pas de receiver côté Mac
- Ultra-rapide (<0.5 sec/scan), batterie 1-2 semaines
- 1D + 2D (codes-barres et QR)

**Workflow** : ouvrir le champ search dans FLEX desktop → scanner avec
NETUM C750 → le code-barres se "tape" dans le champ comme un clavier
externe. Le composant `BarcodeScanner` existant n'a pas besoin de
modification — il accepte les input du clavier.

### À porter V2

Aucun code à changer. Le composant scanner V2 doit aussi accepter un
input clavier (cf NETUM HID emulation) en plus de l'input caméra mobile.

---

## Patterns récurrents de cette session

Tirés des PRs ci-dessus, à garder en tête pour V2 :

1. **Schema sheet : columns gaps OK** — Les colonnes "vides" dans le schema
   sheet (col 15 BDC, col O VENTES avant) peuvent être utilisées sans
   migration destructive. Patron : (a) écrire header manuellement, (b)
   écrire la constante COL dans le code, (c) extension de range read, (d)
   migration endpoint idempotent si backfill nécessaire.

2. **Migration endpoint** — Toujours idempotent, admin-only, retourne un
   diagnostic structuré `{ matched, unmatched, ambiguous, samples,
   updates[] }`. Évite l'effet "j'ai poussé le bouton ?" — l'utilisateur
   sait exactement ce qui s'est passé.

3. **Helper unifié pour matching** — Quand 2+ chemins de code font le
   même match (catalogue → BDT, catalogue → ventes, catalogue → PO), un
   helper unique comme `pieceKey()` réduit la dette et garantit la
   symétrie producer/consumer.

4. **Toggle visuel léger pour state binaire** — Le bouton `🆓` (cluster
   4 item o) et le `CheckCircleIcon` payé (item m) suivent le même
   pattern : icône à 40% opacity quand inactive, 100% + couleur quand
   active. Tooltip explique le sens.

5. **Pill 3-états basée sur 2 champs séparés** — `(isFact, isPaye)` →
   3 états distincts (à facturer, facturé, payé). Préférable à un seul
   enum tri-valué pour la rétrocompat et pour le découplage des actions
   (facturer ≠ marquer payé).

---

## Communication V1 ↔ V2

Pas de canal MCP direct. Pour matérialiser quelque chose côté V1
(question, bug, nouveau patch), demander à yako-san qui relaie vers la
session V1.

Document mis à jour à chaque session significative. Date prochaine
session : à la discrétion de yako-san après test en prod.
