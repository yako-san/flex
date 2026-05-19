# UI Kit · FLEX admin

Recréation interactive en React (Babel inline) de l'app FLEX/REV — gestion
d'atelier de vélo. Source : [yako-san/flex](https://github.com/yako-san/flex)
(v2) + [yako-san/flex-rev-app](https://github.com/yako-san/flex-rev-app) (v1).

## Lancer

Ouvrir `index.html`. Aucune dépendance à installer — React 18 et Babel
sont chargés depuis unpkg.

## Composants

| Fichier | Exports |
|---|---|
| `Icons.jsx` | `window.FlexIcons` — 28 icônes Lucide-style (Tag, Banknote, Wrench, Box, Contact, Bike, Bell, DollarSign, Calendar, FileText…) |
| `Primitives.jsx` | `Button`, `IconButton`, `AddButton`, `Pill`, `PillsToggle`, `PageHeader`, `Field`, `Input`, `Checkbox`, `SectionCard` |
| `Sidebar.jsx` | `Sidebar` — pill jaune, collapsed 100px → expanded 200px au hover |
| `Dashboard.jsx` | `Dashboard` — 4 KPI + 3 colonnes (rendez-vous, stock, factures) |
| `Inventaire.jsx` | `Inventaire` — table BDT, lignes pleines colorées par statut |
| `styles.css` | Toutes les classes utilitaires (app-shell, panel, .pill.*, .btn.*, .ibtn.*) |

## Écrans inclus

- **Inventaire** (`Inventaire.jsx`) — pleine table BDT actifs avec sections
  NOUVEAU/WIP/FACTURÉ/STAFF, chaque ligne est un pill plein coloré par statut.
- **Dashboard** (`Dashboard.jsx`) — 4 KPI cards (BDT, stock, suivis, revenus)
  + 3 colonnes (rendez-vous, pièces épuisées, factures/ventes récentes).
- **Ventes / Services / Pièces / Clients** — placeholders avec PageHeader, à
  étoffer dans une prochaine itération (référer aux screenshots V1 dans
  `docs/v1-reference/screenshots/` du repo flex).

## Limites volontaires

C'est un kit **visuel**, pas du code de production :
- Pas de routing — `useState` switch entre écrans.
- Données statiques en JSX, pas de fetch.
- Pas d'i18n (français hardcodé — l'app vraie utilise `next-intl`).
- Pas d'autosave / optimistic / customConfirm / toast — purement déco.

## Cas d'usage

- **Iterer le design** : copier `styles.css` dans un nouvel HTML, importer
  les primitives, recomposer.
- **Prototyper un nouveau flux** : ajouter un screen, brancher dans le
  switch de `index.html`, copier les patterns de Dashboard/Inventaire.
- **Audit visuel** : comparer side-by-side avec les screenshots V1 du repo
  yako-san/flex (`docs/v1-reference/screenshots/`).
