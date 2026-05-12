# ArchiveChoiceDialog v1.0.19

> Pattern V1 récent : **un clic = 4 décisions atomiques** au lieu d'un wizard
> 3 étapes. Source : `src/components/domain/archive-choice-dialog.tsx`.

## Contexte

Quand un BDT facturé est archivé, on devait :
1. Cocher "facture payée"
2. Choisir mode paiement (Comptant / Interac / Cartes)
3. Cliquer "Archiver"

V1.0.19 a consolidé en **4 boutons** :

```
┌────────────────────────────────────┐
│ 💵 Payée — Comptant     >>         │  vert
│ 📱 Payée — Interac      >>         │  vert
│ 💳 Payée — Cartes       >>         │  vert
│ ──────────────────────────         │
│ 🚫 Évaluation refusée              │  rouge
└────────────────────────────────────┘
```

## Server Action

`archiveBdtWithChoiceAction(bdcId, choice)` dans `src/app/[locale]/admin/bdcs/actions.ts` :

- `COMPTANT` / `INTERAC` / `CARTES` (mapping `CARTES` V1 → `CARTE` V2 enum) :
  transaction Prisma qui marque `bdc.archiveStatus = ARCHIVE_FACTURE`
  + `cbArchiver = true` + dernière `FactureLog.statut = PAYE` + `modePaiement`.
- `REFUSE` : juste `bdc.archiveStatus = ARCHIVE_REFUSE` + `cbArchiver = true`,
  sans toucher la facture.

## UI client

`ArchiveBdtButton` dans `src/app/[locale]/admin/inventaire/[id]/archive-button.tsx`
ouvre le dialog au click, passe le reste à payer en prop pour rappel.

## Pourquoi un dialog séparé (pas customConfirm)

Le dialog `ArchiveChoiceDialog` a 4 actions différentes + 1 cancel, pas un
simple oui/non. [[customConfirm]] ne supporte que oui/non binaire.

## Liens

- [[BDT detail layout]]
- [[Patterns Phase 2]]
- [[Sprint 4 béta plus]] section 4.e
