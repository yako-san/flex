# Sidebar V1 — Spécification UX/UI/CSS

> Source canonique : `components/layout/AppShell.tsx` (V1) et
> `src/components/ui/sidebar.tsx` (V2, déjà partiellement implémenté).
> Capture visuelle de référence : `docs/v2-handoff/screenshots/v1.0.19/0a-Dashboard.png`
> (sidebar ouverte) et `0-archives.png` (sidebar fermée).

---

## 0. Intent du design

La sidebar est **l'identité visuelle V1** : un grand bloc jaune signature
sur le côté gauche, en forme de **pilule arrondie** (`border-radius: 50px`),
qui flotte sur le fond gris `#929292` de l'app. Elle contient toute la
navigation entre les sections atelier (Inventaire, Ventes, Pièces, etc.).

Deux modes principaux :

- **FERMÉ** (collapsed, ~60px) — par défaut sur toutes les pages sauf
  Dashboard. Permet de maximiser l'espace pour la page active. Hover →
  s'expand temporairement.
- **OUVERT** (expanded, ~200px) — par défaut sur `/dashboard` seulement,
  pour rendre les labels visibles d'emblée à l'arrivée. Sur les autres
  pages, l'état "ouvert" survient uniquement au hover.

Hors mobile, la sidebar est **toujours visible**. Sur mobile (< 768px),
elle est remplacée par une top bar pill jaune + un drawer (composant
séparé `SidebarMobileDrawer`).

---

## 1. État FERMÉ (collapsed)

### Dimensions et position

| Propriété | Valeur |
|---|---|
| Largeur | `var(--sidebar-w-collapsed)` = **60px** |
| Hauteur | `h-full` = 100% du conteneur flex parent |
| Position | `relative` dans le flow flex de l'AppShell (occupe sa largeur, pousse le contenu) |
| Border-radius | **50px** (pilule sur tous les coins) |
| Padding vertical | `py-3` = 12px haut + 12px bas |
| Margin | aucune — la séparation avec le main panel est gérée par `gap: 20px` au niveau de l'AppShell |

### Background et ombre

```css
background-color: var(--jaune);   /* #fff056 — jaune signature */
box-shadow: 0 6px 12px rgba(0, 0, 0, 0.23);
overflow: hidden;                  /* labels coupés au repli */
```

L'ombre douce sépare visuellement la pilule du fond gris. Pas de bordure
— le contraste vient du fond.

### Contenu visible en mode fermé

De haut en bas :

1. **Header** : logo monogramme petit, ~40×40px, centré
   - V1 : initiales FLEX-REV stylisées en brun sur jaune (SVG)
   - V2 : `<div class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black text-[var(--jaune)] font-bold">F</div>`
   - Padding header : `px-2 pb-3 text-center`

2. **Navigation icons** : 1 icône par item, 20×20px (Lucide), couleur
   `#9a7b4f` (brun sépia), centrée horizontalement
   - Chaque item est un `<Link>` avec :
     - height : **44px** (`h-11`)
     - padding horizontal : `px-3` (12px de chaque côté → icône au centre dans 60-24 = 36px utiles)
     - border-radius : `rounded-full` (pilule)
     - overflow hidden (le label est techniquement présent mais opacity 0)
   - **Badges numériques** (si présent sur l'item) : 20×20px rond,
     positionné `ml-auto` (en mode ouvert) — en mode fermé, le badge
     reste théoriquement présent mais coupé par l'overflow. **Note V1
     vs V2** : V1 superpose le badge en absolute top-right de l'icône
     pour qu'il reste visible en mode collapsed. À reproduire en V2.

3. **Footer** : avatar utilisateur 40×40px centré, ancré en bas via
   `mt-auto`. V1 = photo Google rond. V2 = `<UserButton/>` Clerk.

### Comportement au hover

```css
/* État au repos */
.sidebar { width: 60px; box-shadow: 0 6px 12px rgba(0,0,0,0.23); }

/* État au hover */
.sidebar:hover {
  width: 200px;
  position: absolute;
  inset-y: 0;
  left: 0;
  z-index: 40;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.40);  /* ombre approfondie */
}
```

**Détail important** : au hover, la sidebar passe en `position: absolute`
pour **ne PAS pousser le contenu** de la page. Elle vient en overlay
au-dessus, avec une ombre plus marquée. Quand la souris quitte, retour
à `relative` dans le flow → contenu intact.

Cette mécanique évite les "sauts" de layout désagréables qui se
produiraient si la sidebar restait `relative` et changeait de largeur
en place.

### Transitions

```css
transition: width 300ms ease-in-out,
            box-shadow 300ms ease-in-out;
```

Les labels des items utilisent une transition séparée sur l'opacité :

```css
.sidebar-item-label {
  opacity: 0;                         /* mode fermé : labels invisibles */
  transition: opacity 200ms ease-in-out;
  /* truncate + tracking restent stables, seul l'opacity change */
}

.sidebar[data-expanded="true"] .sidebar-item-label {
  opacity: 1;                         /* mode ouvert : labels visibles */
}
```

Délai légèrement plus court pour les labels (200ms) que la largeur
(300ms) → les labels apparaissent quand l'espace est presque dispo.

---

## 2. État OUVERT (expanded)

### Dimensions et position

| Propriété | Valeur |
|---|---|
| Largeur | `var(--sidebar-w-expanded)` = **200px** |
| Hauteur | inchangée (100% du conteneur) |
| Position | `relative` (si `expandedByDefault`, ex. Dashboard) OU `absolute z-40` (si hover sur une autre page) |
| Border-radius | **50px** identique |
| Ombre | `0 12px 32px rgba(0, 0, 0, 0.40)` quand absolute, `0 6px 12px rgba(0, 0, 0, 0.23)` quand relative |

### Contenu visible en mode ouvert

Tout ce qui est présent en mode fermé **+ labels** :

1. **Header** : logo agrandi possible — V1 affiche le logo grand format
   (`logo-flex-rev-trans-brun.svg`, ~80×80px) avec un texte
   `v1.3.0-preview` en petit dessous. À reproduire au choix.

2. **Navigation items** : chaque ligne a maintenant
   - Icône à gauche (20×20px, brun `#9a7b4f`)
   - Gap horizontal : `gap-3` = 12px
   - Label texte à droite, en `text-sm font-bold uppercase
     tracking-[0.05em]` → ex. "INVENTAIRE", "VENTES", "PIÈCES"
   - Couleur label = couleur icône (brun sépia `#9a7b4f`)
   - `truncate` activé : si label trop long, il est ellipsé avec `...`
     (mais pas attendu en pratique — les labels sont courts)
   - Badge à l'extrémité droite (si présent), `ml-auto`

3. **Footer** : même avatar centré.

### États de l'item navigation

3 états avec transitions de 150ms :

| État | Fond | Texte/icône |
|---|---|---|
| **Default** (repos) | transparent | `#9a7b4f` |
| **Hover** | `bg-black/10` (rgba(0,0,0,0.1)) | `#9a7b4f` |
| **Active** (route courante) | `bg-[#9a7b4f]` (brun) | `var(--jaune)` `#fff056` |
| **Focus-visible** (clavier) | + `ring-2 ring-black/40` | inchangé |

**Note "Active"** : l'inversion du contraste rend l'item courant très
visible : la pilule devient brune pleine avec le label jaune. C'est
l'équivalent inversé de la sidebar elle-même.

### Détection de l'état active

V1 et V2 utilisent un match par préfixe d'URL :

```tsx
const matchKey = it.matchPrefix ?? it.href;
const active = pathname === it.href
            || pathname.startsWith(`${matchKey}/`)
            || pathname.startsWith(matchKey);
```

Donc `/inventaire/0042` matche l'item Inventaire (`matchPrefix: '/inventaire'`).

---

## 3. Badges numériques sur items

### Visuel

```css
.sidebar-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 20px;
  min-width: 20px;
  border-radius: 9999px;       /* rond complet */
  padding: 0 4px;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
}
```

### Variants par couleur (sens métier)

| Variant | Background | Texte | Quand l'utiliser |
|---|---|---|---|
| `jaune` (défaut) | `#000` (noir) | `var(--jaune)` `#fff056` | Badge informatif neutre |
| `vert` | `var(--st-on-bench-bg)` (vert) | `#000` | Compteur positif (BDT en cours = vert) |
| `rouge` | `var(--rouge)` `#d92020` | `#fff` | Alerte (stock bas, ventes non facturées) |

### Comportement

- Visible UNIQUEMENT si `badge != null && badge > 0`
- Si `badge > 99` → affiche `99+`
- En mode collapsed : V1 positionne le badge en absolute top-right de
  l'icône pour rester visible. V2 sidebar.tsx actuel le met dans le row
  flex → invisible en collapsed (à corriger).

### Exemples concrets V1 (Dashboard)

D'après la screenshot `0a-Dashboard.png` :
- Item **Inventaire** : badge vert "6" → 6 BDT en statut ON BENCH
- Item **Ventes** : badge rouge "1" → 1 vente non facturée
- Item **Pièces** : badge rouge "44" → 44 pièces à commander

Les chiffres viennent de `useInventaire()`, `useVentes()`, `usePieces()`
dans AppShell.tsx, recalculés à chaque mount / mutation SWR.

---

## 4. Mode mobile (< md / < 768px)

La sidebar desktop est **complètement cachée** (`hidden md:flex`). À sa
place :

1. **Top bar mobile** : pill jaune horizontale en haut de l'écran,
   `sticky top: 0`, contient :
   - Hamburger icon à gauche → ouvre le drawer
   - Logo FLEX-REV centré (cliquable → navigue vers `/menu`)
   - UserButton/avatar à droite

2. **Drawer mobile** (`SidebarMobileDrawer`) : modale plein écran qui
   reprend la navigation desktop. Couleur jaune `#fff056`, items en
   liste verticale plein-écran, fermeture par swipe / clic en dehors.

Spec mobile :
```css
.mobile-topbar {
  background-color: var(--jaune);
  border-radius: 50px;
  margin: 12px;
  padding: 0 12px;
  height: 56px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.23);
}
```

---

## 5. Tokens CSS canoniques

Tous définis dans `:root` de `globals.css`. Le code utilise EXCLUSIVEMENT
ces variables — jamais de valeurs hardcodées dans les composants.

```css
:root {
  /* Couleurs */
  --jaune:           #fff056;   /* fond sidebar */
  --jaune-h:         #e6d84e;   /* hover (pas utilisé sur sidebar elle-même) */
  --rouge:           #d92020;   /* badge alerte */
  --st-on-bench-bg:  #5cd62b;   /* badge vert (BDT actifs) */
  --gris-bg:         #757575;   /* pas dans sidebar — utilisé par PageHeader */
  --app-bg:          #929292;   /* fond de l'app derrière la sidebar */

  /* Dimensions sidebar */
  --sidebar-w-collapsed: 60px;
  --sidebar-w-expanded:  200px;

  /* Couleurs sépia pour les items inactifs et logo */
  /* Note : V1 utilise #9a7b4f hardcodé dans sidebar.tsx — à promouvoir
     en variable type --sepia-bdt si on devait l'utiliser ailleurs. */
}
```

---

## 6. Checklist d'implémentation V2

À cocher quand le composant est livré :

- [ ] **Largeur** : 60px collapsed, 200px expanded
- [ ] **Background** : `bg-[var(--jaune)]` = `#fff056` solide
- [ ] **Border-radius** : 50px sur tous les coins (pilule)
- [ ] **Ombre** : `0 6px 12px rgba(0,0,0,0.23)` au repos, `0 12px 32px rgba(0,0,0,0.40)` au hover-expand
- [ ] **Transition** : 300ms ease-in-out sur width, 200ms sur opacity labels
- [ ] **Position** : `relative` dans le flow par défaut, **`absolute`** quand `hover && !expandedByDefault`
- [ ] **Item height** : 44px, `rounded-full`, `px-3 gap-3`
- [ ] **Item état actif** : `bg-[#9a7b4f] text-[var(--jaune)]` (inversé)
- [ ] **Item état hover** : `bg-black/10`
- [ ] **Item état default** : `text-[#9a7b4f]`
- [ ] **Labels** : `text-sm font-bold uppercase tracking-[0.05em]`, opacity 0 collapsed / 1 expanded
- [ ] **Badges** : visibles en collapsed (position absolute si nécessaire), 3 variants couleur
- [ ] **Header** : logo + version, centré, `py-3` padding
- [ ] **Footer** : avatar `mt-auto`, centré
- [ ] **Mobile** : `hidden md:flex` + `SidebarMobileDrawer` séparé
- [ ] **Focus-visible** : ring `ring-2 ring-black/40` au clavier
- [ ] **Active state matching** : `startsWith(matchPrefix)`, accepte sous-routes

---

## 7. Pièges à éviter

1. **Ne PAS** mettre `position: fixed` sur la sidebar — elle doit être
   dans le flow flex de l'AppShell pour que `gap: 20px` fonctionne.
   `absolute` est temporaire (au hover-expand uniquement).

2. **Ne PAS** utiliser `overflow: hidden` sur le parent flex de
   l'AppShell — sinon l'ombre de la sidebar est coupée.

3. **Ne PAS** oublier le `overflow: hidden` sur la sidebar elle-même —
   sans ça, les labels débordent visuellement en mode collapsed.

4. **Ne PAS** transition les couleurs des items en même temps que la
   width de la sidebar — ça crée un effet "lavé" pendant l'expansion.
   Mieux : `transition-colors duration-150` séparé sur les items.

5. **Ne PAS** mettre les badges DANS le flux du label (à droite de gap-3
   après le label) — en collapsed, ils sont invisibles. Position absolute
   sur l'icône en collapsed, relative dans le flow en expanded.

6. **`expandedByDefault`** ne doit être true QUE sur `/dashboard`. Si
   on l'active sur d'autres pages, on perd l'effet "respiration" du
   collapsed qui définit l'identité V1.

---

## 8. Références code

**V1 source** :
- `~/flex-rev-app/components/layout/AppShell.tsx` (sidebar inline, 600+ lignes)
- `~/flex-rev-app/components/layout/SidebarMobileDrawer.tsx` (mobile)
- `~/flex-rev-app/app/globals.css` (tokens)

**V2 amorce** :
- `~/flex/src/components/ui/sidebar.tsx` (119 lignes — base solide,
  manque badges en collapsed + ajustement des shadows)
- `~/flex/src/app/[locale]/admin/_admin-nav.tsx` (AdminSidebar wrapper)
- `~/flex/src/app/globals.css` (tokens — `--jaune`, `--sidebar-w-*` etc.)

**Screenshots références** :
- `~/flex/docs/v1-reference/screenshots/0a-Dashboard.png` — sidebar expanded
- `~/flex/docs/v1-reference/screenshots/0b-menu.png` — mode mobile
- `~/flex/docs/v1-reference/screenshots/1-inventaire.png` — sidebar collapsed
- `~/flex/docs/v1-reference/screenshots/4a-pièces-catalogue.png` — sidebar collapsed avec badges visibles
