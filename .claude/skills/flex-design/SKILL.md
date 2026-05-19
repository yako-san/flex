---
name: flex-design
description: Use this skill to generate well-branded interfaces and assets for FLEX/REV — the bike workshop management app by Yako Cyclo (Montréal) — either for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, type, Helvetica Neue fonts, logos, status palettes, and a React UI kit for prototyping admin screens, dashboards, work-order tables, and POS flows.
user-invocable: true
---

# FLEX design skill

Système de design FLEX/REV — embarqué dans le repo `yako-san/flex`.

## Où trouver quoi (depuis la racine du repo)

| Fichier / dossier | Contenu |
|---|---|
| `docs/design-system/README.md` | Doc complète : fondations, copy, iconographie, index |
| `docs/design-system/colors_and_type.css` | **Référence** des tokens (palette, fonts, statuts, layout). Source de vérité réelle = `src/app/globals.css` |
| `docs/design-system/preview/*.html` | 21 cartes de prévisualisation des tokens (couleurs, typo, composants) |
| `docs/design-system/ui-kit/index.html` | UI kit React standalone (CDN, no-build) — Dashboard, Inventaire, Sidebar |
| `docs/design-system/screenshots/*.png` | 6 refs design (shadow, toggle, sidebar centered) |
| `public/fonts/` | Helvetica Neue LT Std (10 .otf, déjà `@font-face` chargées par `globals.css`) |
| `public/logo/` | 8 logos SVG (F brun/jaune, FLEX rond fr/en/yako) |
| `docs/v1-reference/screenshots/` | 29 captures V1.0.19 — source de vérité visuelle pour Phase 3 |
| `src/app/globals.css` | Tokens **vivants** du produit (à éditer pour changer le système) |
| `src/components/ui/` | Composants shadcn/ui + primitives V1 (Pill, PillsToggle, ToolbarBlock, etc.) |

## Comment designer avec FLEX

- **Tout est en français québécois.** Tutoiement, ton direct, pas de
  validation émotionnelle. Voir CONTENT FUNDAMENTALS dans
  `docs/design-system/README.md`.
- **Une seule couleur d'identité** : jaune `#fff056`. Tout le reste
  (brun, vert, noir) supporte. Le rouge sert UNIQUEMENT pour `FACTURER`
  et les destructifs.
- **Couleurs de statut éclatantes** : chaque ligne/card change de fond
  selon le statut métier (RV/REÇU jaune, ÉVAL vert clair, EN ATTENTE
  orange, FACTURÉ rose, etc.). Mapping complet dans `globals.css`
  tokens `--st-*`.
- **H1 thin & énorme en jaune** sur fond gris sombre — c'est la
  signature typographique. Inverse de la convention.
- **Pas d'image, pas de gradient, pas de blur.** Le design est plat,
  additif par alpha. Les fonds gris = empilement de 20 % d'alpha noir
  (light) ou blanc (dark) sur la base via `--overlay-dark-*` /
  `--overlay-light-*`.
- **Iconographie Lucide** stroke 2px (3px pour `AddButton +` rond jaune).
  Mapping sidebar : Inventaire=Tag, Ventes=Banknote, Services=Wrench,
  Pièces=Box, Clients=Contact.

## Quand on te demande de faire quelque chose

- **Mock / prototype HTML** : utilise `docs/design-system/preview/` comme
  référence, sers les fonts depuis `/fonts/` et les tokens depuis le CSS.
- **Production code (V2)** : édite `src/app/globals.css` (source de vérité
  tokens) et compose avec les primitives de `src/components/ui/`. Tailwind
  v4 + shadcn/ui — pas de fichier de tokens dupliqué.
- **Slides / pitch** : pas de template fourni. Fond `#929292`, H1 thin
  jaune → respecte l'identité.

Si l'utilisateur invoque la skill sans contexte : demande **ce qu'il veut
construire** (écran admin ? nouveau flux ? mock pour pitch ?), **pour
qui** (atelier yako-cyclo ou tenant multi ?), et **avec quel niveau de
fidélité** (sketch / hi-fi prototype / production-ready). Puis agis comme
designer expert FLEX et livre soit du HTML statique, soit du JSX qui
réutilise les primitives du UI kit.
