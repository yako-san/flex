# Reste à faire

> Backlog post-Sprint 4 β+. Maintenu pour le mode autopilote.

## En attente d'action user

### Sprint 2.8 photos — apply SQL

- PR : #18 ouverte
- Fichier : `prisma/migrations/20260512170000_bdc_photo/migration.sql`
- Action : appliquer sur Neon `flex-prod` / branche `main` via console
  Neon SQL Editor. Voir [[Vercel et Neon]].
- Une fois fait → merger PR #18 → continuer Server Actions + UI photos
  (cf [[Sprint 2.8 photos]] section « Suite »).

## Mergeable sans action user

### Refonte WorkflowForm en fragments

Le `WorkflowForm` actuel (`src/app/[locale]/admin/inventaire/[id]/workflow-form.tsx`)
est un méga form unique avec autosave debounced GLOBAL. Au moindre change, on
réenvoie tous les champs (remises, avance, notes, evalStatus, archiveStatus,
checkboxes) à la même Server Action.

**Refonte** : éclater en 4 forms séparés, chacun avec son patch ciblé :
- `RemisesForm` → `patchBdcRemisesAction`
- `AvanceForm` → `patchBdcAvanceAction`
- `NotesClientForm` → `patchBdcNotesAction`
- `StatutsForm` → `patchBdcStatutsAction` (eval + archive)

Avantages : moins de round-trips, autosave plus granulaire (visible quel
fragment est en train de saver).

Pas critique tant que yako-san ne se plaint pas de la perf. ETA : 1 PR moyenne.

### Vraies pages tuto pour /admin/aide

Les 11 cards sur `/admin/aide` ont actuellement juste des blurbs courts. Pas
de pages détaillées (`/admin/aide/01-recevoir-velo`, `/admin/aide/02-evaluer-velo`,
etc.).

Risque : inventer du contenu sur le fonctionnement V2 sans le maîtriser.
Mieux attendre que yako-san écrive lui-même ou valide chaque tuto.

### Polish responsive complet

Audit mobile (tablette atelier + iPhone) sur toutes les pages refondues
Sprint 4. Lighthouse + axe-core cible 90+.

Quick wins prévisibles :
- BdtSidecard col gauche : 280px en desktop, full-width stack en mobile
- Tables denses (Pièces accordéon, Inventaire) : scroll horizontal mobile
- Modal AjoutItems : full-screen mobile
- Sidebar : déjà collapsable mais à vérifier sur iOS Safari notch

### i18n EN-CA des chaînes Sprint 4

CLAUDE.md dit « tout en français » pour yako-cyclo, mais V2 supporte EN-CA
via next-intl. Toutes les chaînes Sprint 4 sont hardcodées FR (eyebrows,
sublines, labels). Pour scale à un atelier anglophone, il faudrait extraire
vers `messages/{fr-CA,en-CA}.json`.

Gros chantier (~200 chaînes), pas pressé.

### Audit accessibilité

- focus-visible sur tous les éléments interactifs
- ARIA labels manquants (boutons icon-only, pills toggle, etc.)
- Contrast WCAG AA (probablement OK avec tokens V1 mais à vérifier)
- Keyboard navigation : Escape closes modals (Radix OK), Tab order
  cohérent sur BDT detail 3 colonnes

ETA : 1-2 PRs (audit + corrections).

## Idées non priorisées

- **Search globale** (Cmd+K) — pages, BDT, clients, pièces, services
- **Notifications in-app** (BDT prêts, suivis dus, stock bas)
- **Export PDF facture vente** (parité V1 — facture BDT déjà OK)
- **Multi-photo upload drag-and-drop par lot** (après Sprint 2.8)
- **Webhook Square pour BDT auto-créés** (V1 utilise Square API)
- **Rappels automatiques** (sms via Twilio ou email rappel 6 mois post-livré)
- **Dark mode** — V1 ne l'a pas, V2 pourrait via les tokens CSS (jaune
  reste accent, fond gris devient sombre)

## Liens

- [[Sprint 4 béta plus]]
- [[Sprint 2.8 photos]]
- [[Hindsight]]
