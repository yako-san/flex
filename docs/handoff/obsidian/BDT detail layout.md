# BDT detail layout

> La page la plus dense et la plus critique de V2.
> Route : `/admin/inventaire/[id]`.

## Capture de référence

[`docs/v1-reference/screenshots/1b-bon-de-travail-éval.png`](../../v1-reference/screenshots/1b-bon-de-travail-éval.png)
(BDT en cours rempli, fond vert clair) et
[`1a-bon-de-travail-reçu-oui-rv.png`](../../v1-reference/screenshots/1a-bon-de-travail-reçu-oui-rv.png)
(BDT RV vide, fond jaune).

## ⚠ Pas 4 zones verticales — **3 colonnes**

Le plan β+ écrit décrivait « 4 zones verticales empilées ». Le screenshot
montre **3 colonnes** côte à côte :

```
PageHeader sticky
┌──────────┬─────────────┬─────────────┐
│ A:CARTE  │ B: SERVICES │ C: PIÈCES   │
│ GAUCHE   │   bloc      │   bloc      │
│ (300px)  │   vert      │   vert      │
│  unifiée │             │             │
│  couleur ├─────────────┴─────────────┤
│  selon   │ D: NOTE CLIENT │ TOTAUX   │
│  statut  │   (Éval/Fact)  │ pill noir│
└──────────┴────────────────┴──────────┘
```

La col gauche **continue en bas** (note interne) sous le dock D.

## Col gauche unifiée (composant `BdtSidecard`)

Source : `src/components/domain/bdt-sidecard.tsx`.

Couleur fond = `VELO_STATUS_COLORS[velo.status].bg` (voir [[Tokens V1]] /
[[Couleur de fond suit le statut]]).

Sections empilées dans la carte :
1. Header : id padé 4 (`0149`) + pill statut
2. **BON DE TRAVAIL** : vélo (marque/modèle/couleur/taille) + client lien
3. **DATE IN / DATE OUT** grid 2 cols
4. **SÉQUENCE DE TRAVAIL** : mécanos eval/meca/ctrl read-only
5. **AVANCEMENT** : 4 checkboxes interactives (slot `advancementSlot`)
   - Si cbEval coché → pills statut éval inline (INDECIS/ATTENTE/APPROUVE/REDUX/REFUSE)
6. Pills CLIENT/VÉLO toggle (URL `?vue=client|velo`)
7. **NOTE INTERNE** textarea (séparée en card blanche dessous)

## Col centre : Services

Items `kind = 'SERVICE' | 'FORFAIT'`. Header coloré statut + icône Wrench +
compteur + bouton `+` (popover ajout). Footer : remise svc % + total.

## Col droite : Pièces

Items `kind = 'PIECE'`. Header coloré + icône Cog. Chaque ligne pièce a
[[useOptimisticPatch|PieceCmdEditor]] inline (badge cmdStatus colorée
selon tokens `--cmd-*`).

## Dock bas (sous centre + droite uniquement)

- **Note pour le client** (card blanche) avec pills [Éval][Facture]
- **BDCTotaux** (pill noir) : Services + Pièces + lien « avance ? » +
  reste à payer

## Composants client interactifs

- [[BdtAdvancement]] — slot pour les checkboxes + evalStatus pills inline
  avec useOptimistic + autosave par patch ciblé
- `PieceCmdEditor` — popover statut commande + note fournisseur avec
  useOptimistic React 19
- `ArchiveBdtButton` — bouton + [[ArchiveChoiceDialog v1.0.19]]
- `DeleteBdtButton` — [[customConfirm]] + [[toast helper]]
- `WorkflowForm` — méga form avec autosave debounced 500ms global (TODO :
  pourrait être éclaté en fragments séparés, voir [[Reste à faire]])

## Server Actions ciblées (autosave granulaire)

- `patchBdtCheckboxAction(bdcId, key, value)` — toggle d'une seule checkbox
- `patchBdtEvalStatusAction(bdcId, newStatus)` — changement evalStatus
- `archiveBdtWithChoiceAction(bdcId, choice)` — archive + facture PAYÉ
  + mode atomique (transaction Prisma)
- `updatePieceItemCmdAction(itemId, formData)` — patch cmdStatus + cmdNote
- `updateBdtWorkflowAction(prev, formData)` — gros patch (remises, avance,
  notes, eval+archive statuts) consommé par WorkflowForm autosave

## Liens

- [[Sprint 4 béta plus]]
- [[Patterns Phase 2]]
- [[Tokens V1]]
- [[Couleur de fond suit le statut]]
