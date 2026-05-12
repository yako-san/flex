# Couleur de fond suit le statut

> Loi du design Sprint 4 β+. Pas de gris neutre — toute zone qui représente
> un BDT, un vélo, une commande, une vente est colorée selon son statut.

## Liste vélo / BDT

Source : `VELO_STATUS_COLORS` dans `src/lib/velo/status-labels.ts`.

| Statut | bg | Sens |
|---|---|---|
| RV / RECU | `#fff056` jaune | Rendez-vous fixé / vélo reçu |
| EVAL | `#88fa4e` vert clair | En évaluation |
| EN_ATTENTE | `#fb923c` orange | Attente décision client |
| APPROUVE | `#62e335` vert moyen | Devis approuvé |
| ON_BENCH | `#5cd62b` vert vif | En réparation |
| CTRL_QLTE | `#2e7d32` vert foncé | Contrôle qualité |
| FINI | `#fce4ec` rose pâle | Travaux terminés |
| FACTURER | `#e53935` rouge | À facturer |
| FACTURE | `#ffcdd2` rose pâle | Facture émise |
| LIVRE | `#e0e0e0` gris | Vélo récupéré |

## Application sur les pages

| Page | Zone colorée |
|---|---|
| `/admin/bdcs` (liste) | **Lignes pleines** colorées selon statut |
| `/admin/inventaire/[id]` (detail) | **Carte gauche entière** + blocs Services + Pièces selon statut |
| `/admin/velos` (liste) | Pill statut par ligne (background ligne reste blanc/gris) |
| `/admin/ventes` | Card rose pâle si FACTURE, blanc sinon |
| `/admin/pos` (réception) | Bandeau header coloré selon PO status (jaune EN_ATTENTE, rose PARTIEL, vert RECU, gris ANNULE) |

## Statuts commande (pièces)

Voir [[Tokens V1]] section `--cmd-*`. Sigles `... — √ $ # @` avec couleurs.

## Statuts éval BDT (`evalStatus`)

Voir pills dans [[BDT detail layout]] section AVANCEMENT :
- INDECIS : gris neutre (placeholder)
- ATTENTE : orange `--st-attente-bg`
- APPROUVE : vert `--st-approuve-bg`
- REDUX : vert clair `--st-eval-bg`
- REFUSE : rouge `--rouge`

## Mode paiement facture

Voir [[ArchiveChoiceDialog v1.0.19]] et `FactureStatutControls`. Bouton
PAYÉ vert. Bouton ANNULÉ gris.

## Liens

- [[Tokens V1]]
- [[BDT detail layout]]
