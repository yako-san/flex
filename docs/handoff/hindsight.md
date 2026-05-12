# HINDSIGHT — leçons apprises sur flex-app V2

Pour éviter qu'une session future refasse les mêmes erreurs. Pièges déjà
rencontrés et décisions qu'il a fallu revisiter.

## Découvertes design V1 contre-intuitives

### Le BDT detail est en **3 colonnes**, pas 4 zones empilées

Le plan β+ initial décrivait « 4 zones verticales » (Header sticky / FicheToggle
/ BDCPanel / bottom dock). Mais la capture officielle `1b-bon-de-travail-éval.png`
montre clairement **3 colonnes** :

- Col gauche (~280-300px) : carte unifiée colorée selon statut (id+pill, vélo,
  client, dates, séquence travail, AVANCEMENT, pills CLIENT/VÉLO, note interne)
- Col centre : bloc Services + remise %
- Col droite : bloc Pièces + remise + Cost
- Bas (sous centre+droite **uniquement**) : note client + BDCTotaux pill noir

→ Toujours faire confiance au screenshot, pas au plan écrit.

### Couleur de fond suit le statut, partout

Pas de gris neutre. La carte gauche **et** les blocs Services/Pièces sont
colorés selon `velo.status` (jaune RV/REÇU, vert ÉVAL./ON BENCH/APPROUVÉ,
orange EN ATTENTE, rose FACTURÉ, gris LIVRÉ). C'est pas optionnel.

### Pas de `<select>` natif pour client/marque/etc.

V1 utilise des **dropdowns customs** (fond noir, texte blanc, header coloré
« ✓ Sélection → »). Tout choix exclusif important utilise des **pills toggle**
ou un dropdown custom Radix. Le `<select>` natif est réservé aux champs
techniques (mode paiement, statut archive, etc.).

### `/admin/menu` mobile iOS-like n'est PAS dans le PDF V1.0.19

J'ai vu une capture menu mobile dans le 1er PDF (6 captures) puis cherché
le port en Phase 3.5. **Skipper** : pas dans le PDF officiel V1.0.19 (28
captures) et pas de route `/admin/menu` en V2.

## Pièges techniques

### Vitest fake timers + `waitFor` se bloquent mutuellement

`vi.useFakeTimers()` empêche `await waitFor(...)` de progresser (waitFor
utilise des setTimeout réels en interne). Solution : `vi.useRealTimers()`
au début du test qui a besoin de waitFor, ou ne pas mélanger.

### `vi.mock` est hoisted, les variables référencées **non**

```ts
// ❌ Ne marche pas
const calls = { success: vi.fn() };
vi.mock('sonner', () => ({ toast: calls })); // calls === undefined ici

// ✅ vi.hoisted partage la ref avec le mock hoisted
const calls = vi.hoisted(() => ({ success: vi.fn() }));
vi.mock('sonner', () => ({ toast: calls }));
```

### `@vitejs/plugin-react` est ESM-only et casse `vitest.config.ts` (CJS)

Pour transformer le JSX React 19 dans Vitest, n'utilise PAS le plugin React.
Mets simplement dans `vitest.config.ts` :

```ts
export default defineConfig({
  esbuild: { jsx: 'automatic' },
  // ...
});
```

### `tsconfig` projet a `jsx: 'preserve'` (Next gère lui-même)

Donc en pur tsc/test, il faut soit l'override automatique (ci-dessus) soit
`import React from 'react'` explicite. La 1ère solution est plus propre.

### happy-dom optin par fichier suffix

Pour éviter de payer happy-dom sur ~540 tests purs node :

```ts
test: {
  environment: 'node',
  environmentMatchGlobs: [
    ['src/**/*.dom.test.{ts,tsx}', 'happy-dom'],
  ],
}
```

Convention de nommage : `xxx.dom.test.tsx` = tests qui ont besoin du DOM.

### Radix Dialog rend le title dans 2 endroits (warning aria)

Tester par `getByRole('button', { name: /label/i })` plutôt que par
`queryByText(title)` qui peut matcher plusieurs nœuds.

## Décisions à revisiter (Sprint 2.8 photos)

### `BdcPhoto` plutôt que `VeloPhoto`

V1 stockait les photos par vélo (dossiers Drive). V2 les attache au **BDT**
car un même vélo peut avoir plusieurs BDT successifs avec des photos
différentes par visite. La query `velo.photos` reste possible via
`velo.bdcs.flatMap(b => b.photos)`.

→ Si plus tard on veut un onglet « historique photos vélo », c'est facile :
juste agréger côté query.

### Path Blob = `workshops/{wid}/bdcs/{bid}/{uuid}.{ext}`

Pour permettre `del(path)` (suppression par path stable, pas par URL random
Vercel). UUID ajoute une couche d'unguessabilité sur le path.

### `addRandomSuffix: false`

On a déjà notre UUID + le token random Vercel sur le sous-domaine. Pas
besoin de double-random.

## Trucs sur l'application Vercel / Neon

### Le projet Vercel s'appelle `flex` sous l'équipe `yako-sans-projects`

URL preview : `flex-git-<branch-slug>-yako-sans-projects.vercel.app`. Pas
`yako-san` (sans `s`). Vercel tronque les slugs branche à 63 caractères
+ ajoute un hash 6 chars.

### Deployment Protection bloque les URLs preview (host_not_allowed)

Avant de m'arracher les cheveux à essayer 6 variantes d'URLs, **passer par
le PR Vercel comment** qui contient l'URL signée. Ou désactiver
Deployment Protection (Vercel project settings) pour des previews publiques.

### URL prod stable = `https://flex-tan.vercel.app`

Suit la branche `main`. Voir `HANDOFF.md` à la racine.

### Migrations Prisma : Neon `flex-prod` / `main`, pas `flex-v2/production`

Le projet `flex-v2` est dev/test (jamais utilisé par Vercel). Si tu appliques
une migration là par erreur, l'app prod plantera avec « column does not
exist ».

## Workflow git

### `main` est protégée — push direct refusé (HTTP 403)

Toujours passer par PR. Une fois un PR ouverte, le commit Vercel preview
est attaché automatiquement par le bot Vercel.

### Convention branche

- `claude/sprint4-phase-3.X-nom` pour les phases Sprint 4
- `claude/sprint2.8-bootstrap-photos-blob` pour les sprints non-UI
- `claude/handoff-*` pour les docs/handoff

Toutes mergées via merge classique (pas squash) pour préserver l'historique
des commits granulaires phase par phase.

### yako-san a autorisé le merge auto une fois la PR prête

Critère : CI Vercel preview commenté = ✓ (build vert) + 0 review comment +
0 changement demandé. Alors je peux merge sans demander.

**Exception** : PR avec migration SQL en attente d'apply — NE PAS merger
sans avoir reçu confirmation explicite que le SQL est appliqué.

## Patterns Phase 2 (Sprint 4 β+) — ergonomie

### `useDebouncedAutosave` : skip initial render

L'effet doit ignorer le premier render (sinon il save dès le mount avec la
valeur initiale, créant un round-trip inutile). Pattern : `useRef(false)` qui
passe à true au premier effect.

### `useOptimistic` React 19 : appel doit être DANS `startTransition`

Erreur classique :

```ts
// ❌ Avertissement React : optimistic outside transition
const handle = () => {
  setOptimistic(newValue);
  saveAction();
};

// ✅
const handle = () => {
  startTransition(() => {
    setOptimistic(newValue);
  });
  saveAction();
};
```

### `customConfirm` singleton publish/subscribe

Ergonomie type `window.confirm` mais avec UI stylée. Le singleton ne supporte
qu'une seule modale à la fois (par design — on n'empile pas des confirms).

Le `<ConfirmDialogHost />` doit être monté **une fois** dans le layout
racine (déjà fait dans `src/app/[locale]/layout.tsx`).

## Aliments pour réflexion (pas encore décidé)

- **Refonte `WorkflowForm` en fragments** : actuellement un mega form unique
  avec autosave global qui ré-envoie tous les champs à chaque change. Pourrait
  être éclaté en 4 forms (workflow / remises / avance / notes), chacun avec
  son autosave et son patch ciblé. Plus de complexité, moins de round-trips.
  À voir si yako-san se plaint de perf.

- **i18n EN-CA** : le CLAUDE.md dit « tout en français » pour yako-cyclo,
  mais V2 supporte EN-CA via next-intl. Si on vend à un autre atelier
  anglophone, il faudra extraire toutes les chaînes FR hardcodées de
  Sprint 4 (eyebrows, titres, sublines, labels). Gros chantier, pas pressé.

- **Photos UI sur BDT** : 4 options de placement dans BdtSidecard :
  1. Onglet supplémentaire dans la toggle CLIENT/VÉLO (« PHOTOS »)
  2. Section dédiée en bas de la carte gauche
  3. Bloc séparé sous la note interne
  4. Modal full-screen accessible par bouton « 📷 N » dans header

  Pas encore décidé. À discuter avec yako-san avant de coder.

- **WorkflowForm autosave : flush au unmount** ? Actuellement le debounce
  500ms peut sauter si l'utilisateur navigue trop vite (le hook cleanup
  annule le timer). Pour zéro perte, il faudrait un `flush()` au beforeunload
  ou au navigate-away. À voir si le pattern actuel pose problème en réel.
