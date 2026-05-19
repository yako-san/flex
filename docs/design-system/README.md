# FLEX Design System

> Système de design pour **FLEX/REV** — l'application de gestion d'atelier de
> mécanique de vélo (1–5 personnes) construite par yako-san pour Yako Cyclo
> (Montréal, fr-CA) et destinée à être commercialisée en SaaS multi-tenant.

Ce dossier reconstruit le design system FLEX à partir du code de production
v2 (Next.js 15 + Tailwind v4 + Prisma) et de la référence visuelle v1.

---

## Le produit en bref

**FLEX/** est une application web de gestion d'atelier qui gère **un seul
flux métier intégré** :

- **Bons de travail (BDT)** — réception de vélo → évaluation → approbation
  client → mécanique → contrôle qualité → facturation → livraison
- **Inventaire** de pièces (catalogue, fournisseurs, commandes, réception
  PO avec stock réservé/physique)
- **Ventes directes** (POS comptoir, walk-in)
- **Clients & vélos** (annuaire, historique)
- **Forfaits & services à la carte** (avec sous-tâches mécano cochables)
- **Facturation** (TPS 5 % + TVQ 9,975 %, acompte, suivi)

Public : ateliers de vélo francophones de 1 à 5 personnes. L'utilisateur
type est **un mécanicien, pas un développeur** — la priorité est la
**densité d'information lisible** sur grand écran et la **rapidité
gestuelle** (autosave, optimistic UI, customConfirm).

## Surfaces produit

FLEX existe en **deux versions de code coexistantes** :

| Produit | Repo GitHub | Stack | Statut |
|---|---|---|---|
| **FLEX v1 (REV)** | [yako-san/flex-rev-app](https://github.com/yako-san/flex-rev-app) | Next.js 14 + Google Sheets API | En prod chez Yako Cyclo |
| **FLEX v2** | [yako-san/flex](https://github.com/yako-san/flex) | Next.js 15 + Postgres + Clerk multi-tenant | En cours de port |

Les deux partagent **exactement les mêmes tokens visuels**. Le port v2
s'appuie sur 28 captures v1 versionnées dans `docs/v1-reference/` pour
préserver la densité et les couleurs de statut.

> **Pour aller plus loin :** lis les `CLAUDE.md` de chacun des repos — ils
> contiennent toutes les conventions métier, le glossaire (BDT, BDC, PO,
> RV, etc.) et l'historique des décisions design.

---

## Index des fichiers

```
.
├── README.md                  ← ce fichier
├── SKILL.md                   ← skill cross-Claude-Code
├── colors_and_type.css        ← tokens CSS (palette + typo + layout)
├── fonts/                     ← Helvetica Neue LT Std (.otf)
├── assets/                    ← logos SVG (F brun, FLEX:/REV rond)
├── preview/                   ← cartes de prévisualisation (Design tab)
├── ui_kits/
│   └── flex_app/              ← UI kit React de l'application admin
└── slides/                    ← (pas de deck fourni — dossier absent)
```

---

## Content fundamentals

**Langue** : **TOUT EST EN FRANÇAIS QUÉBÉCOIS.** Pas d'anglais. C'est une
règle dure — le `CLAUDE.md` du repo flex la rappelle dès la première
ligne. Les noms techniques de symboles peuvent rester en anglais
(`userId`, `createdAt`), pas le user-facing.

**Tutoiement et ton**

- **Tutoiement** — l'app parle au mécanicien comme à un collègue
  (« Confirme la suppression », « Coche les sous-tâches »).
- **Pas de validation émotionnelle** (« Excellente idée ! », « Bien joué ! »).
  Aller direct au fait. Cette règle vient du dev mais infuse la copy.
- **Direct, technique, précis** — vocabulaire métier assumé. On dit
  *BDT* (bon de travail), *PO* (purchase order), *RV* (rendez-vous),
  *stock physique* / *stock réservé*. Aucun rond-de-jambe pédagogique.
- **Pas de mots de remplissage** — « Aucune pièce à 0 ou moins. » plutôt
  que « Vous n'avez actuellement aucune pièce dont le stock serait
  inférieur ou égal à zéro. »

**Casing**

- **Titres H1 de page** : casse normale (`Dashboard`, `Inventaire`, `Bon
  de travail #0145`). PAS de Title Case anglo.
- **Eyebrows et sublines** (au-dessus du H1) : `lowercase italique`
  (`mai 2026`, `vélos en atelier`, `catalogue achats`). Donne un ton
  éditorial.
- **H4 / table headers / pills / buttons** : `UPPERCASE` + letter-spacing
  0.1em (`RV`, `EN ATTENTE`, `FACTURÉ`, `INVENTAIRE`).
- **Légendes de colonnes (`thead`)** : `lowercase` 11px weight 600
  (`item`, `notes`, `sku`, `stock`, `prix cost`, `prix vente`). C'est
  une signature V1 — toujours lowercase, jamais Title Case.

**Émoji**

Oui, **utilisés ponctuellement** comme marqueurs de séquence mécano (✋
remplacer, 👌 forfait Base, 🔧 réparation), notes internes (🚨 urgent),
et indicateurs d'étape. **Pas d'emoji décoratif** dans les titres, CTA,
ou nav. Lucide React est l'iconographie principale.

**Numérotation**

- BDT / factures : `padStart(4, '0')` → `0145`, `0123`. Toujours 4
  chiffres, toujours en `font-mono` tabular-nums.
- Prix : `$1 234,56 $` (espace insécable comme séparateur de milliers,
  virgule décimale, $ après — convention fr-CA).
- Pourcentages : `9,975 %` (espace avant %).

**Exemples concrets (extraits du code)**

| Contexte | Texte |
|---|---|
| Empty state | « Aucune pièce à 0 ou moins. » |
| Empty state | « Aucun BDT en RV/REÇU. » |
| KPI label | « BDT actifs » / « Stock à commander » / « Revenus du mois » |
| Sub KPI | « facturé depuis le 1er mai » |
| Tooltip | « Évaluation envoyée » |
| Section header | « rendez-vous » / « bons de travail » / « pièces — stock épuisé » |
| Confirmation | « Archiver le BDT #0145 ? » |

---

## Visual foundations

### Palette

**Une couleur signature** : `--jaune: #fff056` — jaune presque
fluorescent. C'est l'identité de FLEX. Sidebar, H1, CTA primaire, focus
ring, pastilles « add », statut RV/Reçu : tout est jaune.

**Trois supports** :
- `--brun: #806642` — le brun du logo Yako Cyclo. Pastille active dans
  la sidebar jaune, accent secondaire.
- `--dark: #1a1a1a` — texte principal sur fond clair.
- `--app-bg` — Gris système, fond global de l'admin shell. `#7e7e7e` en
  dark mode, `#cccccc` en light mode (`body.light-mode`).

**Statuts métier — couleurs « éclatantes »** : c'est un trait distinctif
de FLEX. Plutôt qu'une palette neutre, **chaque ligne et carte change de
couleur de fond selon le statut du BDT** :

| Statut | Background | Foreground |
|---|---|---|
| `RV` / `REÇU` | jaune `#fff056` | noir |
| `ÉVAL` | vert clair `#88fa4e` | noir |
| `EN ATTENTE` | orange `#fb923c` | noir |
| `APPROUVÉ` / `ON BENCH` | vert vif `#62e335` / `#5cd62b` | noir |
| `CTRL QLTÉ` | vert foncé `#2e7d32` | blanc |
| `FACTURER` | rouge `#e53935` | blanc |
| `FACTURÉ` | rose pâle `#ffcdd2` | rouge bordeaux |
| `LIVRÉ` | gris `#e0e0e0` | gris foncé |

Cette « peau » de couleur traverse la table inventaire, la sidebar de
détail BDT, les blocs Services/Pièces, les pills. **Pas de gris neutre
sur un BDT actif.**

### Typographie

**Helvetica Neue LT Std** (toute la famille `.otf` est livrée avec ce
design system dans `fonts/`). Stack fallback : `Helvetica, Arial,
sans-serif`.

Hiérarchie volontairement **non-conventionnelle** :

| Élément | Taille | Poids | Casse |
|---|---|---|---|
| `h1` page title | `clamp(32px, 7vw, 50px)` | **300 (thin)** | normale, jaune |
| `h2` | 1.8rem | **900** (black) | normale |
| `h3` | 1.3rem | 600 | normale |
| `h4` | 0.9rem | **900** | **UPPERCASE** + tracking 0.1em |
| `h5` / labels | 11px | 600 | **lowercase** |
| `h6` | 0.5rem | 600 | italic |
| `thead th` | 11px | 600 | **lowercase** |

Le H1 thin/léger en jaune sur fond gris foncé est la **signature
typographique** de FLEX. Inverse de la convention : grand mais léger.

### Layout

- **Sidebar pill jaune** — `border-radius: 50px`, posée à gauche avec
  20px de marge, **100 px collapsed** / **200 px expanded** au hover.
  Au hover, passe en `position: absolute` pour ne pas pousser le
  contenu (overlay shadow approfondie).
- **Panneau principal** — `bg-black/20` sur `--app-bg`, `border-radius:
  50px`, occupe le reste du viewport. `data-admin-theme="dark"` bascule
  les `--text-secondary-*` en blanc-alpha.
- **PageHeader sticky** — fond `--gris-bg` (#757575), eyebrow lowercase
  italique blanc 65 %, titre jaune `clamp(32,7vw,50)` thin.
- **`.bloc-contenu`** — second wrapper `bg-black/20 rounded-[30px]` à
  l'intérieur du panneau principal qui encadre TOUT le contenu
  fonctionnel. C'est la structure : `panneau → header → bloc contenu →
  cards`.
- **Cards** — `bg-white/85`, `rounded-2xl` (16px), `shadow-sm`, padding
  4 (16px). Headers de section ont une bordure basse `--gris-bord`.

### Backgrounds, textures, gradients

**Aucun gradient.** Aucune image full-bleed. Aucun pattern. Aucune
texture. Les seuls « gradients » sont les **superpositions
semi-transparentes** sur le Gris système (`--app-bg`) :

- Panneau : `rgba(0,0,0,0.20)` — verre sombre
- Bloc contenu (sur panneau) : `rgba(0,0,0,0.20)` × 2 cumulé
- Cards (sur bloc) : `rgba(255,255,255,0.85)` — verre clair

C'est **un design plat, additif par alpha**. Très calme visuellement
en dehors des accents jaune/statut.

### Borders, shadows, corners

- **Coins** : 4 rayons standards. `12px` inputs / `16px` (rounded-2xl)
  cards / `30px` blocs contenu + boutons pill / `50px` sidebar +
  panneau principal.
- **Borders** : 1.5px `rgba(0,0,0,0.2)` sur les inputs, focus passe à
  `--jaune` + glow 3px `--input-focus-ring`. `--gris-bord` (#e0e0e0)
  sur les `thead`/séparateurs.
- **Shadows** :
  - sidebar repos : `0 6px 12px rgba(0,0,0,0.23)`
  - sidebar hover-expand : `0 12px 32px rgba(0,0,0,0.40)`
  - card : `0 2px 6px rgba(0,0,0,0.10)`
  - AddButton repos : `0 2px 6px rgba(0,0,0,0.18)`, hover :
    `0 3px 10px rgba(0,0,0,0.25)`
- **Focus** : `outline: 2px solid var(--jaune); outline-offset: 2px`.

### Animations & states

- **Pas de bounce, pas de spring.** Seulement `transition-colors
  150ms ease` et `transition-[width,box-shadow] 300ms ease-in-out`
  pour la sidebar hover-expand.
- **Hover** sur card / lien : `bg-[var(--gris-fond)]` ou `bg-white/100`
  (passe de white/85 à white plein).
- **Hover** sur bouton primaire : passe à `--jaune-h` (#e6d84e).
- **Hover** sur ghost / link : `bg-black/5`.
- **Press** : pas de scale ni transform, juste un changement de
  background.
- **Focus-visible** : ring 2px jaune offset 2px. **Toujours.**

### Listes / tables — système d'alternance

Pattern V1 récurrent. Au lieu d'un zebra striping classique :

```
.list-row-even      → rgba(255,255,255,0.70)
.list-row-odd       → rgba(255,255,255,0.85)
.list-row-highlight → #d4edbc        (vert clair sélection)
.list-header        → rgba(255,255,255,0.50) italic 14px bold 700
.list-subcategory   → rgba(255,255,255,0.35), texte JAUNE
```

Les sous-catégories ont leur titre en **jaune sur fond blanc 35 %** —
pattern très spécifique au catalogue pièces et aux services.

### Transparency, blur

- Pas de `backdrop-filter` / blur. Tout est par alpha solide.
- Beaucoup d'utilisation de `rgba(0,0,0,0.5)` et `rgba(255,255,255,X)`.

### Vibe d'imagerie

Pas d'imagerie photographique dans le produit. Les seuls visuels sont
les **logos ronds** (cercle brun avec « FLEX:/REV » + « yako.cyclo /
Montréal, Qc » centré, en jaune). Mood général : **outil de travail
calme, plein écran, dense, fonctionnel** — pas un produit marketing.

---

## Iconography

**Lucide React** est l'icone-system principal. Le design system v2
remplace Heroicons (utilisé en v1) par Lucide pour bénéficier du jeu
plus complet. **Stroke 2px par défaut**, stroke 3px sur le `+` rond
AddButton (signature visuelle plus appuyée).

Icônes les plus utilisées dans le code, à connaître :

| Lucide | Usage |
|---|---|
| `Tag` | sidebar INVENTAIRE (étiquette = vélo en atelier) |
| `Banknote` | sidebar VENTES (billet) |
| `Wrench` | sidebar SERVICES (outil) |
| `Box` | sidebar PIÈCES (boîte de stock) |
| `Contact` | sidebar CLIENTS (vCard) |
| `LayoutDashboard` | dashboard |
| `Bike` | KPI BDT actifs |
| `Bell` | suivis, alertes |
| `DollarSign` | revenus, prix |
| `Calendar` | rendez-vous, dates |
| `FileText` | factures |
| `Settings`, `HelpCircle`, `Archive`, `Upload` | popover secondaire |
| `Inbox`, `ClipboardCheck`, `Hammer` | étapes mécanos |
| `QrCode`, `Smartphone`, `Banknote`, `Receipt` | tutoriels |

**Comment FLEX rend ses icônes** :

- **Pastille jaune ronde** (60 px sidebar / 40 px AddButton / 32 px
  UtilButton / 8×8 KPI) avec l'icône Lucide centrée. Le **+ rond
  jaune** est la signature d'action principale partout.
- **Pastille brune** pour les items de sidebar non actifs : icône
  `--brun-text` (#9a7b4f) sur fond transparent, **active** = pastille
  brune `#9a7b4f` avec icône jaune.
- **Pastilles colorées par contexte** sur le dashboard : icône Bike en
  vert (BDT actifs), Package en rouge (stock à commander), Bell en
  jaune (suivis), DollarSign en vert (revenus).

**Émoji comme étape mécano** : le BDT utilise quelques émoji codifiés
pour la séquence des sous-tâches (✋ 🔧 👌 ✊ — variables selon
forfait). Ce sont des **labels de sous-tâche**, pas des décorations.

**Logos** (dans `assets/`) :

- `flex-rond-yako.svg` — logo cercle brun complet « FLEX:/REV » + «
  yako.cyclo / Montréal, Qc » en jaune. **Multi-tenant** : sera
  substitué par `Workshop.logoUrl` quand activé.
- `flex-rond-fr.svg` / `flex-rond-en.svg` — variantes localisées sans
  tag tenant.
- `flex-f-brun.svg` / `flex-f-jaune.svg` — monogramme `F` typographique
  (utilisé en favicon / sidebar collapsed mobile).

---

## Notes & caveats

- **Slides** : aucun template de deck n'a été fourni — pas de dossier
  `slides/` créé.
- **Site marketing public** (yako.ca) : mentionné dans le `CLAUDE.md`
  v1 mais hors scope de ce design system (pas de code fourni).
- **Helvetica Neue LT Std** est livrée complète (.otf) dans `fonts/`.
  Pour les bundles, considérer un sous-set Roman/Light/Bold uniquement.
- Le **multi-tenant theming** (`Workshop.theme` JSON qui override les
  CSS vars) est prévu dans le code v2 — ce design system documente la
  palette **par défaut yako-cyclo**.

