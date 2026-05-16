# Session v2 — Portage UI/UX/CSS : finalisation

> **Date du brief** : 2026-05-15 (état post-audit visuel)
> **Repo v2 cloné en local** : `~/flex` (commit HEAD `10b1c7a`)
> **Prompt de kickoff** : section 12 en bas, copier-coller dans une nouvelle session.

---

## 0. Contexte en 30 secondes

- **v1** (FLEX-REV) = Next.js 14 + Google Sheets, prod `flex-rev-app-ten.vercel.app`. Mono-atelier. Référence visuelle.
- **v2** (FLEX) = Next.js 15 + Postgres + Clerk + shadcn/ui, prod `flex-tan.vercel.app`. SaaS multi-tenant. Cible.
- **Sprint 4 β+** = port look + structure + flow V1 → V2 → **livré au niveau code** (`main` HEAD `10b1c7a`) mais **pas conforme visuellement** au rendu prod (audit 2026-05-15).
- **Cette session** = identifier pourquoi le rendu ne matche pas le code, corriger, livrer une parité visuelle V1 réelle.

---

## 1. LECTURE OBLIGATOIRE AVANT TOUT (3 fichiers)

| Ordre | Fichier | Pourquoi |
|---|---|---|
| 1 | `~/flex/CLAUDE.md` | Conventions repo v2 — git protégé, port 3001, Neon flex-prod, etc. |
| 2 | `~/flex/docs/handoff/AUDIT-VISUEL-V2-2026-05-15.md` | Le diagnostic visuel — ce qui doit changer |
| 3 | `~/flex/docs/v1-reference/screenshots/` | 31 PNG V1.0.19 — source de vérité visuelle |

Tout le reste (MEGA-BUNDLE, v1-ui-bundle, TRANSFER-V2-COMPLET) est référence
historique qui vit dans le repo **privé** `yako-san/flex-rev-app`.
Pas accessible sans auth — inutile pour démarrer cette session.

---

## 2. Accès aux ressources

### Code

| | Local | GitHub |
|---|---|---|
| **v2 (cible — écriture)** | `~/flex` cloné | `yako-san/flex` **public**, branche `main` protégée |
| **v1 (référence — lecture)** | `~/flex-rev-app` (Mac de yako-san) | `yako-san/flex-rev-app` **privé** — accès via session v1 ou copies locales |

### Prod live

| | URL |
|---|---|
| v1 | `https://flex-rev-app-ten.vercel.app/login` |
| v2 | `https://flex-tan.vercel.app/fr-CA/admin` (Clerk auth) |

Auth déjà active dans Brave de yako-san — pas de re-login dans Claude for Chrome.

### Screenshots & PDF

| Ressource | Accès |
|---|---|
| 31 screenshots V1.0.19 (PNG) | `~/flex/docs/v1-reference/screenshots/` (dans repo v2 **public**) — accessible via raw.githubusercontent.com/yako-san/flex/main/docs/v1-reference/screenshots/`<nom>` |
| PDF compilé V1 | n'existe que dans le repo v1 privé (`yako-san/flex-rev-app/docs/v2-handoff/V1-SCREENSHOTS.pdf`) — si besoin, demander à yako-san de le rendre accessible |
| Design system HTML showcase | `~/Drive/FLEX-REV/screenshots-v1/design-system-showcase.html` (Mac local seul) |

### Docs handoff (dans le repo v2 public, accessibles externe)

- `~/flex/docs/handoff/BRIEF-UI-SESSION.md` ← **ce fichier**
- `~/flex/docs/handoff/AUDIT-VISUEL-V2-2026-05-15.md` ← le diagnostic ciblé
- `~/flex/docs/handoff/HANDOFF-TO-V1.md` ← contexte historique v1
- `~/flex/docs/handoff/primer.md` ← onboarding v2
- `~/flex/docs/v1-v2-parity.md` ← état des sprints

Docs supplémentaires dans le repo v1 **privé** (pour référence si nécessaire) :
`MEGA-BUNDLE.md`, `v1-ui-bundle.md`, `TRANSFER-V2-COMPLET.md`, `design-system.md`.

---

## 3. État réel v2 (2026-05-15)

**Ce qui est livré (commit `10b1c7a` sur main) :**

- Tailwind v4 + shadcn/ui (New York) + lucide-react ✓
- `globals.css` complet : tous tokens V1 (`--jaune #fff056`, `--app-bg #929292`,
  `--gris-bg #757575`, statuts vélo/pièces, étapes mécanos, alpha overlays,
  typo `--h1-size`→`--th-size`, classes `.btn-primary`, `.input-system`, etc.)
- 20 composants UI : Badge, Button, Checkbox, ConfirmDialog, DataTable, Dialog,
  DropdownMenu, IconButton, Input, Label, PageHeader, Pill, PillsToggle,
  Popover, Select, Sidebar, SidebarMobileDrawer, Sonner, Toolbar, Tooltip
- 9 composants domain : AjoutItemsModal, ArchiveChoiceDialog, BDCHeader,
  BDCTotaux, BdtSidecard, ClientAutocomplete, FactureStatusPanel,
  RemiseInput, VeloFormFields
- 17 pages admin restructurées (bdcs, clients, velos, pieces 4 onglets,
  ventes, pos, dashboard, settings, services, forfaits, marques, equipe, etc.)
- Patterns : `useDebouncedAutosave`, `useOptimisticPatch`, `customConfirm`, toast
- 544 tests Vitest passants

**Ce qui visuellement ne marche pas (audit du 2026-05-15) :**

| Élément | Code | Rendu prod |
|---|---|---|
| Sidebar jaune | `bg-[var(--jaune)]` | ✅ rendue jaune (zoom confirmé) |
| Fond app `#929292` | `bg-[var(--app-bg)]` dans layout.tsx | ❌ apparaît crème/blanc |
| Main panel dark | `md:bg-black/20 md:rounded-[50px]` | ❌ invisible, panel blanc |
| PageHeader bandeau gris | `bg-[var(--gris-bg)]` (= `#757575`) | ❌ invisible |
| H1 jaune Thin | inline `style={{ color: '#fff056', fontWeight: 300 }}` | ❌ apparaît noir regular |
| KPI cards Dashboard | (à vérifier dans `_components/`) | ❌ fond blanc shadcn |

**Hypothèses prioritaires** (cf audit doc) :
1. Le déploiement `flex-tan.vercel.app` peut être obsolète vs HEAD `main`
2. Tailwind v4 ne génère peut-être pas toutes les classes arbitraires
3. Certaines pages contournent `<PageHeader>` canonique

---

## 4. État de la branche `claude/ui-color-cleanup` (à merger d'abord)

**PR #68 ouverte** : https://github.com/yako-san/flex/pull/68
Titre : `refactor(ui): couleurs #666/#888 hardcodées → token --text-secondary-60`
7 fichiers de formulaires. Indépendant de tout le reste. Mergerable immédiatement.

```bash
# Option A — gh CLI si installé
gh pr merge 68 --squash --delete-branch --repo yako-san/flex

# Option B — MCP GitHub
# mcp__github__merge_pull_request avec pull_number=68, merge_method=squash
```

> Vérifier `gh --version` avant. Si absent (cas yako-san actuel) → utiliser
> MCP GitHub `mcp__github__*` (installé dans l'environnement).

---

## 5. Plan d'action en 4 phases

### Phase A — Diagnostic (0.5 j)

1. **Vérifier déploiement** : Vercel UI → Project flex → Deployments → quelle branche pointe `flex-tan` ? Date du dernier build ?
2. **Test local** : `cd ~/flex && pnpm install && pnpm dev` puis `http://localhost:3001/fr-CA/admin`. Comparer au rendu prod.
3. **DevTools** : ouvrir Inspecteur sur le main panel, vérifier que `md:bg-black/20` est dans `class=` et dans le CSS généré. Si absent → bug Tailwind v4.

→ Sortie attendue : ticket clair "ce qui empêche le shell de rendre".

### Phase B — Fix shell (0.5 j)

Selon diagnostic Phase A :
- Si déploiement obsolète → redéployer + valider visuellement
- Si Tailwind v4 → remplacer arbitraires `bg-[var(--X)]` par classes nommées définies dans `@theme {}` de `globals.css` (ex: `bg-jaune` après ajout de `--color-jaune` dans `@theme`)
- Si CSS spécificité → ajuster `data-admin-theme="dark"` pour ne pas écraser les backgrounds

### Phase C — Fix régressions composants (1 j)

- **KPI cards Dashboard** : refondre pour fond `var(--overlay-dark-20)` + icônes circulaires colorées + chiffres jaunes
- **Inventaire** : ajouter colonnes dropdowns mécano (éval/méca/contrôle), si absentes
- **Pièces** : ajouter col `statut` avec pills `--cmd-*` (`…`/`—`/`√`/`$`/`#`/`@`)
- **Ventes** : highlight jaune sur ligne `À FACTURER` + 4 boutons icône action droite (preview / PDF / sync / archive)
- **Clients** : pills BDT colorées par statut à droite de chaque ligne

### Phase D — Re-audit visuel (0.5 j)

Reprendre les 5 paires de pages (Dashboard / Inventaire / Pièces / Clients / Ventes), comparer V1 et V2 côté à côté via Claude for Chrome, valider que l'identité visuelle est revenue.

---

## 6. Stack v2 (confirmer en début de session)

```bash
cd ~/flex
cat package.json | grep -E "next|tailwindcss|@radix-ui|lucide|clerk|prisma|next-intl"
```

Attendu :
- Next.js 15.1
- React 19
- Tailwind CSS v4.3 (`@import "tailwindcss"` + `@theme {}` dans globals.css — PAS de tailwind.config.ts)
- shadcn/ui (New York) — Radix primitives
- lucide-react 1.14
- Clerk 6.12 (auth)
- Prisma 5.22 + Postgres Neon
- next-intl 3.26

---

## 7. Conventions git v2

`main` est protégée (push direct → HTTP 403). Flux obligatoire :

```bash
cd ~/flex
git checkout -b claude/<sujet-court>
# ... commits ...
git push -u origin claude/<sujet-court>
gh pr create --title "..." --body "..."
gh pr merge --squash --delete-branch
git branch -D claude/<sujet-court>
```

**Branches mergées s'accumulent côté remote** — yako-san fait le bulk-delete manuel périodiquement.

---

## 8. Dev local — commandes

```bash
cd ~/flex
pnpm install              # une fois
pnpm dev                  # port 3001 (3000 pris par v1)
pnpm test                 # vitest run — 544 tests
pnpm typecheck            # tsc --noEmit
pnpm lint                 # next lint
```

**Base de données** : 2 projets Neon — `flex-v2` (dev, non utilisé Vercel), `flex-prod` (vraie prod, branchée Vercel). Pour migrer du SQL, **toujours** sur `flex-prod/main` sinon prod plante.

---

## 9. Préférences yako-san (héritées V1)

- **Français québécois** dans tout (code user-facing, commits, PRs, réponses)
- **Pas de validation émotionnelle** — direct, rigoureux, pas de "t'as raison"
- **Valider la cause avant la solution** — confirmer le bug avant de coder un fix
- **Push auto sur branche de travail** (pas main) — pas besoin de confirmation
- **Bump auto APP_VERSION** quand l'utilisateur mentionne un n° de version
- **JAMAIS toucher prod pendant tests** (Neon `flex-v2` = dev)
- **Préparer blob de reprise détaillé** avant compaction de session
- **Pas de TodoWrite spam** sauf si la tâche le justifie vraiment

---

## 10. Agents et skills à mobiliser

| Agent / Skill | Quand |
|---|---|
| **`Explore`** | Retrouver vite un composant, tous les usages d'une classe CSS, etc. |
| **`Plan`** | Décisions architecturales (ex: refonte KPI cards) |
| **`vercel:shadcn`** | Si nouveau composant shadcn à ajouter ou customiser |
| **`vercel:nextjs`** | Questions Next.js 15 App Router, Server Actions |
| `simplify` | Après livraison Phase C — revoir qualité |

---

## 11. Vérifications à faire à l'ouverture de la session

```bash
# 1. Repo v2 présent, synchronisé avec remote, et au bon commit
cd ~/flex && git fetch && git status -uno && git log --oneline -3
# HEAD attendu : 10b1c7a "feat(ui): port complet UI V1 → V2 — AppShell, tokens, formulaires (#67)"
# Si "Your branch is behind 'origin/main'" → git pull avant tout

# 2. Docs handoff présentes
ls ~/flex/docs/handoff/   # BRIEF-UI-SESSION.md + AUDIT-VISUEL-V2-2026-05-15.md attendus

# 3. Screenshots v1 dans v2 repo (référence visuelle)
ls ~/flex/docs/v1-reference/screenshots/ | wc -l   # ~31

# 4. Stack v2 + version Node (Tailwind v4 exige Node 20+)
cd ~/flex && node --version    # ≥ 20
cd ~/flex && cat package.json | grep -E '"next"|tailwindcss|@radix-ui|lucide|clerk'

# 5. CLI disponibles ? (déterminent l'approche pour PR / Vercel)
which gh         # GitHub CLI
which vercel     # Vercel CLI
# Si absent → utiliser MCP : mcp__github__* et mcp__plugin_vercel_vercel__*

# 6. PR cleanup à merger (numéro fixe : #68)
# https://github.com/yako-san/flex/pull/68
```

---

## 12. PROMPT DE KICKOFF — copier-coller dans nouvelle session

```
Tu travailles sur le repo v2 cloné en local à ~/flex (yako-san/flex sur GitHub).
Objectif : finir le port UI/UX/CSS v1→v2 — le code shell semble correct mais
le rendu visuel sur flex-tan.vercel.app ne reflète pas le design v1.

LECTURE OBLIGATOIRE AVANT TOUT :

1. ~/flex/CLAUDE.md (conventions repo v2)
2. ~/flex/docs/handoff/BRIEF-UI-SESSION.md (ce brief)
3. ~/flex/docs/handoff/AUDIT-VISUEL-V2-2026-05-15.md (diagnostic ciblé)

Référence visuelle :
- 31 screenshots v1 dans ~/flex/docs/v1-reference/screenshots/
- v1 live : https://flex-rev-app-ten.vercel.app/login (Brave déjà connecté)
- v2 live : https://flex-tan.vercel.app/fr-CA/admin

NOTE : le repo v1 yako-san/flex-rev-app est PRIVÉ — pas accessible
sans auth GitHub. Tout ce qui est nécessaire pour cette session vit
dans yako-san/flex (public). Si tu veux du contexte v1 supplémentaire
(MEGA-BUNDLE, design-system.md), demande à yako-san de le copier
dans ~/flex/docs/handoff/ via PR.

ÉTAPE 1 — Diagnostic (NE PAS coder avant d'avoir terminé) :

a. `cd ~/flex && git fetch && git status -uno && git log --oneline -3`
   HEAD attendu : `10b1c7a` ou plus récent. Si behind origin → `git pull`.

b. Vérifier le déploiement flex-tan :
   - Si `vercel` CLI dispo → `vercel inspect flex-tan.vercel.app`
   - Sinon → MCP `mcp__plugin_vercel_vercel__authenticate` puis lookup
   - Sinon → Claude-in-Chrome navigate vers https://vercel.com/yako-san/flex
     et lire la liste des deployments
   Objectif : confirmer que `flex-tan` sert bien le commit HEAD de `main`.
   Si stale (build > 24h ou pointant sur autre branche) → redeploy et stop.

c. Lancer en local : `node --version` (≥ 20), puis
   `cd ~/flex && pnpm install && pnpm dev` (port 3001).
   Ouvrir via Claude-in-Chrome : `mcp__Claude_in_Chrome__navigate`
   → http://localhost:3001/fr-CA/admin. Screenshot. Comparer aux
   `~/flex/docs/v1-reference/screenshots/4-dashboard*.png`.

d. DevTools via Claude-in-Chrome :
   - `mcp__Claude_in_Chrome__find` pour locate le main panel div
   - `mcp__Claude_in_Chrome__javascript_tool` pour
     `getComputedStyle(el).backgroundColor` du panel
   - Attendu : `rgba(0, 0, 0, 0.2)` (= `bg-black/20`)
   - Si différent → la classe ne s'applique pas, root cause à trouver

→ Format de sortie obligatoire (max 200 mots, 3 puces) :
   • CAUSE : ce qui empêche le rendu (1 phrase)
   • PREUVE : computed style observé / fichier coupable / class manquante
   • FIX PROPOSÉ : ligne de code à changer ou commande à lancer

ÉTAPE 2 — Fix shell, puis re-audit, puis fix régressions métier
(détaillé dans BRIEF-UI-SESSION.md section 5, phases B/C/D).

Avant de coder, merger PR #68 (claude/ui-color-cleanup, indépendante) :
https://github.com/yako-san/flex/pull/68 via `gh pr merge 68 --squash`
ou MCP `mcp__github__merge_pull_request`.

Préférences : français, pas de validation émotionnelle, valider la cause
avant la solution, push auto sur branches de travail. Pas de modifs sur
main directement (protégée).
```

---

## 13. Si tu as un doute

- Lire les CLAUDE.md (v1 + v2) — beaucoup de conventions y sont
- Regarder les screenshots V1 avant d'inventer — la densité, les couleurs de fond par statut et les patterns d'interaction se voient sur l'image
- Demander à `Explore` agent pour trouver un fichier rapide
- Demander à `Plan` agent pour les décisions architecturales

**Ne pas réinventer ce qui existe.** Le repo v2 a déjà 17 PRs de port UI livrées. Avant de coder, vérifier ce qui est déjà fait via `grep` ou `find`.
