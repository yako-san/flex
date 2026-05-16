# Audit visuel v1 vs v2 — 2026-05-15

> Audit via Claude for Chrome — captures live `flex-rev-app-ten.vercel.app` ↔
> `flex-tan.vercel.app`. 5 paires de pages comparées.
> Code repo v2 examiné en local (`~/flex` cloné).

---

## TL;DR

**Le code v2 du shell est correct.** Layout, Sidebar, PageHeader implémentent
les patterns V1 (sidebar jaune `bg-[var(--jaune)]`, fond app `bg-[var(--app-bg)]`,
main panel `md:bg-black/20 md:rounded-[50px]`, H1 inline `color: #fff056` +
`fontWeight: 300`).

**Mais visuellement, sur `flex-tan.vercel.app`, le rendu ne reflète pas le
code source actuel** :
- Sidebar : ✅ jaune `#fff056` rendue (zoom confirmé)
- Main panel dark : ❌ pas visible (panel apparaît blanc sur fond gris clair)
- H1 PageHeader jaune Thin : ❌ apparaît en noir regular
- Bandeau gris `#757575` PageHeader : ❌ pas visible
- KPI cards dark : ❌ apparaissent blanches shadcn

**Hypothèses à valider** (par ordre de probabilité) :

1. **Déploiement obsolète** sur `flex-tan.vercel.app` — la prod actuelle
   ne reflète peut-être pas le dernier commit `main` (`10b1c7a` du 2026-05-15
   "feat(ui): port complet UI V1 → V2"). Vérifier dans Vercel quelle branche
   pointe `flex-tan` et l'âge du build.

2. **CSS pas généré par Tailwind v4** — les classes `md:bg-black/20`,
   `bg-[var(--jaune)]`, `bg-[var(--app-bg)]` doivent être présentes dans le
   bundle. Vérifier `dist`/`.next/static/css` ou via DevTools onglet Elements.

3. **PageHeader pas wired sur toutes les pages** — sur `/admin` (dashboard),
   le rendu actuel montre subtitle "MAI 2026" + h1 "Dashboard" en noir avec
   4 boutons SHEETS/DRIVE/GMAIL/CONTACTS à droite. Pourrait être un fragment
   custom au lieu du composant canonique.

---

## Pages auditées

1. `/dashboard` vs `/fr-CA/admin`
2. `/inventaire` vs `/fr-CA/admin/bdcs`
3. `/catalogue/pieces` vs `/fr-CA/admin/pieces`
4. `/clients` vs `/fr-CA/admin/clients`
5. `/catalogue/ventes` vs `/fr-CA/admin/ventes`

---

## Code source — déjà conforme V1

### `src/app/[locale]/admin/layout.tsx`

```tsx
<div className="min-h-screen bg-[var(--app-bg)] md:flex md:h-screen md:overflow-hidden md:p-5">
  <AdminMobileTopBar />
  <div className="hidden md:block" style={{ width: 'var(--sidebar-w-collapsed)' }}>
    <AdminSidebar />
  </div>
  <div className="flex min-w-0 flex-1 flex-col md:rounded-[50px] md:bg-black/20" data-admin-theme="dark">
    <AdminWorkshopBar />
    <main className="flex-1 overflow-auto">{children}</main>
  </div>
</div>
```

✓ Tous les tokens V1 référencés correctement.

### `src/components/ui/sidebar.tsx`

```tsx
<aside className="bg-[var(--jaune)] py-3 text-black rounded-[50px] ..." />
```

✓ Visuel confirmé via zoom — sidebar EST jaune.

### `src/components/ui/page-header.tsx`

```tsx
<header className="bg-[var(--gris-bg)] sticky top-0 ...">
  <h1 style={{ color: '#fff056', fontWeight: 300, fontSize: 'clamp(32px, 7vw, 50px)' }}>
    {title}
  </h1>
</header>
```

✓ H1 en inline style — devrait gagner sur tout reset Tailwind.

---

## Régressions visuelles confirmées (au rendu)

### 1. Main panel — `md:bg-black/20` ne se voit pas

Au rendu sur `flex-tan.vercel.app`, le panneau qui contient PageHeader + main
apparaît blanc/gris clair. La classe `md:bg-black/20` devrait produire un fond
`rgba(0,0,0,0.20)` sur l'élément parent. À diagnostiquer :
- Inspecter cet élément via DevTools — la classe est-elle dans `class=` ?
- Le CSS généré contient-il `.md\:bg-black\/20`?
- Une règle plus spécifique (peut-être venant de `[data-admin-theme="dark"]`)
  override-t-elle ?

### 2. PageHeader bandeau `#757575` invisible

Même remarque — `bg-[var(--gris-bg)]` (= `#757575`) sur `<header>` devrait
produire une bande gris foncé sticky. Au rendu elle est blanche ou absente.

### 3. H1 noir au lieu de jaune

L'inline style `color: '#fff056'` devrait gagner. Sur `flex-tan` il est noir.
Hypothèse : la page actuellement servie sur `flex-tan` n'a pas le commit
`10b1c7a` (le port UI complet du 2026-05-15).

### 4. KPI cards Dashboard

V1 : fond sombre + icônes circulaires colorées + chiffres jaunes.
V2 rendu : fond blanc + icônes monochromes + chiffres noirs.

À grep dans le code v2 :
```bash
grep -rn "bg-card\|bg-white\b" src/app/[locale]/admin --include="*.tsx"
```

---

## Régressions métier (confirmées par comparaison visuelle V1/V2)

| Page | V1 | V2 rendu | Sévérité |
|---|---|---|---|
| Inventaire | colonnes éval / méca / contrôle (dropdowns mécano inline) | colonnes items / services / pièces (chiffres financiers) | bloquant pour workflow |
| Pièces | col `statut` avec pills `…/—/√/$/#/@` | col absente | bloquant pour "à commander" |
| Ventes | highlight JAUNE sur ligne À FACTURER + 4 boutons icône action droite | ligne rose uniforme, pas de boutons | régression UX |
| Clients | pills BDT colorées à droite (statut visible d'un coup d'œil) | colonnes lang/remise/vélos/notes | info différente |

---

## Plan d'action — par priorité

### P-1 — Vérifier le déploiement

Avant toute chose, confirmer que `flex-tan.vercel.app` sert bien le code
de `main` HEAD `10b1c7a`. Si ce n'est pas le cas, redéployer ou pointer
sur la bonne branche dans Vercel. Beaucoup des "régressions" peuvent
disparaître d'elles-mêmes.

```bash
# Côté Vercel UI :
# Project flex → Settings → Git → Production Branch = main ?
# Deployments → flex-tan → date du dernier build = aujourd'hui ?
```

### P0 — Test local pour isoler

```bash
cd ~/flex
pnpm install
pnpm dev    # port 3001
# Naviguer http://localhost:3001/fr-CA/admin
# Comparer au rendu prod
```

Si le rendu local est bon → c'est un problème de déploiement.
Si le rendu local est aussi mauvais → c'est un bug code.

### P1 — DevTools investigation

Ouvrir DevTools sur `/fr-CA/admin` :
- Inspecter `<div class="... md:bg-black/20 ...">` — la classe est-elle là ?
- Computed styles → `background-color` est-il `rgba(0,0,0,0.2)` ou autre ?
- Identifier la règle CSS qui gagne

### P2 — KPI cards Dashboard

Refondre `<KpiCard>` (probablement dans `_components/` du dashboard) pour
utiliser `bg-[var(--overlay-dark-20)]` + icône circulaire colorée +
chiffres jaunes.

### P3 — Régressions métier

- Inventaire : ajouter colonnes dropdowns mécano (éval/méca/contrôle)
- Pièces : ajouter col `statut` pills `--cmd-*`
- Ventes : highlight jaune sur "À FACTURER" + 4 boutons icône action
- Clients : pills BDT colorées par statut

### P4 — Merger d'abord la branche `claude/ui-color-cleanup`

7 fichiers, `color: #666/#888 → var(--text-secondary-60)`. Indépendant
du reste.
