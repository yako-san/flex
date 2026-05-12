# Sprint 4 β+

> Port look + structure + flow V1.0.19 vers V2. **Livré intégralement
> 2026-05-12.** Voir `CLAUDE.md` section « État Sprint 4 β+ » pour le détail.

## Critère de succès

yako-san doit pouvoir utiliser V2 pendant une journée d'atelier sans avoir
l'impression d'utiliser un nouveau produit. Pas « visuellement reconnaissable »,
plutôt « cohérent en flow ».

## Phases livrées

| # | Périmètre | Note |
|---|---|---|
| 0 | Tailwind v4 + shadcn + tokens V1 + Lucide | déjà mergé en PR #6 |
| 1 | UI base (Sidebar, PageHeader, Pill, PillsToggle, DataTable) | PR #7 |
| 2 composants | BDCHeader, BDCTotaux, FactureStatusPanel, AjoutItemsModal, [[ArchiveChoiceDialog v1.0.19]], BdtSidecard | PR #7 |
| 2 patterns | [[Patterns Phase 2]] (autosave, toast, optimistic, customConfirm) | PR #9 |
| 3.1 | /admin/bdcs liste groupée colorée | PR #9 |
| 3.2 | [[BDT detail layout]] 3 colonnes + BdtSidecard | PR #9 |
| 3.3 | /admin/bdcs/new | PR #9 |
| 3.4 | /admin Dashboard 4 KPI + 3 col | PR #9 |
| 3.5 | _skip_ — pas de capture menu mobile V1.0.19 | — |
| 3.6-3.10 | velos, clients, pieces, ventes, pos | PR #9 |
| 3.11 | settings/import/maintenance restyle | PR #9 |
| 3.11b | /admin/settings hub grid 9 cartes + /atelier sous-route | PR #10 |
| 3.12 | /admin/services unifié Forfaits + À la carte | PR #11 |
| 3.13 | nouvelle /admin/aide 3 colonnes 11 tutoriels | PR #11 |
| 3.14 | /admin/equipe + /admin/marques | PR #12 |
| 3.15 | /admin/pos/[id] + /admin/ventes/[id] | PR #13 |
| 3.16 | PageHeader sur 19 pages new/edit | PR #14 |
| 3.17 | /admin/forfaits + nettoyage final | PR #15 |
| 4.a | customConfirm + toast sur 6 delete buttons | PR #9 |
| 4.b | Autosave WorkflowForm | PR #9 |
| 4.c | useOptimistic PieceCmdEditor | PR #9 |
| 4.d | BdtSidecard AVANCEMENT interactif | PR #9 |
| 4.e | ArchiveChoiceDialog câblé | PR #9 |
| 4.f | Cleanup derniers window.confirm/alert | PR #16 |

## Audit final

- Aucun `window.confirm`/`alert` dans `src/app/[locale]/admin`
- Aucun `<h1 style={{ fontSize: '1.75rem' }}>` ni `background: '#1a1a1a'` inline
- Tous les destructifs via [[customConfirm]]
- Tous les Server Action returns d'erreur via [[toast helper]]
- [[Tokens V1]] partout
- 573 tests Vitest verts (+29 nouveaux dans PR #19)

## Reste à faire

Voir [[Reste à faire]].

## Liens

- [[Index]]
- [[BDT detail layout]]
- [[Patterns Phase 2]]
- [[Tokens V1]]
