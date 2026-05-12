# Tokens V1

> CSS variables dans `src/app/globals.css`. Override Tailwind utilities pour
> rester cohérent avec la palette V1.

## Palette signature

| Token | Valeur | Usage |
|---|---|---|
| `--jaune` | `#fff056` | Boutons primary, accents, AddButton, pills CLIENT/VÉLO actifs |
| `--jaune-h` | `#e6d84e` | Hover du jaune |
| `--rouge` | `#d92020` | Destructifs (delete, danger) |
| `--rouge-h` | `#b81818` | Hover rouge |
| `--gris-bg` | `#757575` | PageHeader sticky fond |
| `--gris-fond` | `#fafafa` | Cards secondaires, table thead |
| `--gris-bord` | `#e0e0e0` | Bordures subtiles |

## Statuts vélo (`--st-*`)

| Statut | bg | fg |
|---|---|---|
| RV / RECU | `--st-rv-bg` `#fff056` | `--st-rv-fg` `#000` |
| EVAL | `--st-eval-bg` `#88fa4e` | `--st-eval-fg` `#000` |
| EN_ATTENTE | `--st-attente-bg` `#fb923c` | `--st-attente-fg` `#000` |
| APPROUVE | `--st-approuve-bg` `#62e335` | `--st-approuve-fg` `#000` |
| ON_BENCH | `--st-on-bench-bg` `#5cd62b` | `--st-on-bench-fg` `#000` |
| CTRL_QLTE | `--st-ctrl-qlte-bg` `#2e7d32` | `--st-ctrl-qlte-fg` `#fff` |
| FINI | `--st-fini-bg` `#fce4ec` | `--st-fini-fg` `#c62828` |
| FACTURER | `--st-facturer-bg` `#e53935` | `--st-facturer-fg` `#fff` |
| FACTURE | `--st-facture-bg` `#ffcdd2` | `--st-facture-fg` `#b71c1c` |
| LIVRE | `--st-livre-bg` `#e0e0e0` | `--st-livre-fg` `#333` |

Source unique côté TS : `src/lib/velo/status-labels.ts:VELO_STATUS_COLORS`.

## Statuts pièces / cmd (`--cmd-*`)

| Statut | bg | fg | Sens |
|---|---|---|---|
| LISTEE (`...`) | `--cmd-listee-bg` `#fff` | `--cmd-listee-fg` `#000` | Pièce listée |
| ESTIMEE (`—`) | `--cmd-estimee-bg` `#ffcfc9` | `--cmd-estimee-fg` `#b10202` | Pièce estimée |
| A_COMMANDER (`√`) | `--cmd-a-cmder-bg` `#d4edbc` | `--cmd-a-cmder-fg` `#11734b` | À commander |
| EN_COMMANDE (`$`) | `--cmd-en-cmde-bg` `#ffff00` | `--cmd-en-cmde-fg` `#473821` | En commande |
| RECU_PARTIEL (`#`) | `--cmd-recu-part-bg` `#ffe0b2` | `--cmd-recu-part-fg` `#e65100` | Reçu partiel |
| RECUE (`@`) | `--cmd-recue-bg` `#00ff00` | `--cmd-recue-fg` `#000` | Reçue |

⚠ Le `$` EN_COMMANDE = `#ffff00` (jaune pur) **différent** du `--jaune` signature
(`#fff056`). Volontaire — différencie statut transitoire de couleur app.

## Étapes mécaniciens (`--etape-*`)

| Étape | bg | fg | Note |
|---|---|---|---|
| eval | `--etape-eval-bg` `#d9ead3` | `--etape-eval-fg` `#38761d` | Vert pâle |
| meca | `--etape-meca-bg` `#b6d7a8` | `--etape-meca-fg` `#38761d` | Vert moyen |
| ctrl | `--etape-ctrl-bg` `#93c47d` | `--etape-ctrl-fg` `#274e13` | Vert foncé |

Dégradé de vert qui suit la progression du workflow.

## Texte secondaire

| Token | Valeur |
|---|---|
| `--text-secondary-35` | `rgba(0,0,0,0.35)` |
| `--text-secondary-50` | `rgba(0,0,0,0.50)` |
| `--text-secondary-60` | `rgba(0,0,0,0.60)` |
| `--text-secondary-70` | `rgba(0,0,0,0.70)` |
| `--text-secondary-80` | `rgba(0,0,0,0.80)` |

Override de Tailwind `text-gray-300/400/500/600/700` qui ont une teinte
bleutée OKLCH non désirée (cf [[Stack technique]]).

## Typo

| Token | Valeur | Usage |
|---|---|---|
| `--h1-size` | `3.0rem` (48px) | Titre PageHeader (font Helvetica Thin 400) |
| `--h2-size` | `1.8rem` | Sections importantes (900) |
| `--h3-size` | `1.3rem` | Entêtes de bloc (600) |
| `--h4-size` | `0.9rem` | Boutons, étiquettes (900 uppercase) |
| `--th-size` | `11px` | Headers de tableau (600 lowercase) |

## Border-radius pattern

- `9999px` / `999px` : pills, capsules (ToolbarBlock, btn primary, statut)
- `50%` : boutons icône (rond complet — AddButton, UtilButton)
- `24px` : modals
- `16px` (rounded-2xl) : cards principales (BdtSidecard, sections detail)
- `12px` : inputs, sections claires
- `30px` : btn-primary/secondary/danger V1 (38px height)

## Loi du design V1

1. **Capsules partout** pour ce qui est interactif important
2. **Transparences > couleurs pleines** (rgba sur fond gris adaptable)
3. **Jaune unique `#fff056`** = identité (hover → `#e6d84e`)
4. **Pas de bordures sauf** btn-secondary, custom-checkbox, input-system

## Liens

- [[Index]]
- [[BDT detail layout]]
- [[Couleur de fond suit le statut]]
- [[Stack technique]]
