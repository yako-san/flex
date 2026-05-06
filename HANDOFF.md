# Handoff — état actuel flex-app v2

Branche : `claude/resume-from-handoff-HginU`. Production : https://flex-tan.vercel.app/

## ✅ Phases livrées

| # | Phase | Status | Commit clé |
|---|---|---|---|
| 1 | Multi-tenant (Clerk Orgs ↔ Workshop) | ✅ | `4b888fb` |
| 2 | CRUD complet (clients, vélos, marques, équipe, services, forfaits, pièces) + pages détail navigables | ✅ | `205862e` |
| 3 | Workflow BDT (création + items + sous-tâches + transitions + remises) | ✅ | `b3bc145` |
| 4 | PDF (HTML+Puppeteer pour pixel-perfect ; templates en attente Claude Design) | 🟡 | `d6a2d55` |
| 5 | Stock dynamique (StockMovement append-only + recalc auto) | ✅ | `b3bc145` |
| 6 | Notifications email/SMS | ⏳ | — |
| 7 | Onboarding nouveau workshop | ⏳ | — |
| 8 | Stripe billing | ⏳ | — |
| 9 | Polish (i18n, error handling, accessibility, perf) | 🟡 | — |

## 🎯 État fonctionnel

V2 supporte aujourd'hui en production :

**Daily ops** :
- Créer/modifier/supprimer client, vélo, marque, membre équipe, service, forfait (avec sous-tâches), pièce (avec stock)
- Numérotation auto vélo (Counter VELO_SEQUENCE, démarre à 142 après import yako-cyclo)
- Créer un BDT lié à un vélo, ajouter items (services / pièces / forfaits)
- Forfait → sous-tâches auto-instanciées avec status TODO/DONE/SKIPPED cliquable
- Workflow BDT : statut éval, statut archive, 4 checkboxes, remises (% ou $) services + pièces, notes
- Calcul auto des totaux services + pièces - remises
- **Stock dynamique** : réservation auto à l'ajout d'un item PIECE, libération à la suppression, sortie physique à la facturation. UI ajustement manuel + historique 30 derniers mouvements.
- Émettre une facture immutable : numérotation séquentielle (FACTURE_SEQUENCE, démarre à 6), TPS 5% + TVQ 9.975% Québec calculés au prorata des items taxables/non-taxables, snapshot complet (lines + tax rates + fiscal entity)
- Télécharger PDFs : éval (sans taxes, signature), facture (avec taxes, mode paiement)

**Settings** :
- Identité fiscale : raison sociale, tagline, NEQ, TPS, TVQ, adresse complète, contact, footer text → utilisée dans tous les PDFs
- Logo upload (PNG/JPG/WebP/SVG, max 500 KB) → utilisé en header PDF + favicon dynamique
- Liaison workshop ↔ Clerk Organization (multi-tenant)

**Import v1** : pipeline complet preserve **toutes les données** (10 tables d'entités avec colonnes propres + `legacy_raw_v1` JSONB + dump intégral dans `workshop.legacy_v1_extras`).

## 🟡 Limitations connues / TODO

- **Templates PDF** : layout/CSS sont fonctionnels mais pas pixel-perfect avec le modèle v2.5 fourni. Solution choisie : user designe le HTML/CSS via **Claude Design**, m'envoie le résultat, je l'intègre dans `src/lib/pdf-html/templates/{eval,facture}.ts`.
- **Réception PO** : la création de POs n'a pas d'UI (importée depuis v1 mais pas modifiable). Marquage "RECU" pour incrémenter le stock pas implémenté.
- **Vente directe (comptoir)** : importée, mais pas de form de création.
- **Notifications** : Phase 6 (emails clients pour éval/facturation, SMS « vélo prêt »).
- **Onboarding** : Phase 7 (signup nouveau workshop).
- **Stripe billing** : Phase 8 (abonnement par workshop).
- **Email markdown** : `transformClients` n'applique pas `stripMarkdownEmail` → emails comme `[a@b.c](mailto:a@b.c)` arrivent tels quels (cf import yako-cyclo).
- **Old Neon project** `flex-v2` à supprimer (cleanup non bloquant).

## 🚨 Méthodologie utilisateur (rappels)

- Avant un clic destructif (SQL prod, delete) : **demander d'abord ce que l'user voit**, attendre la réponse, **puis** envoyer la commande dans un message séparé.
- Mode **autopilote** : l'user peut le demander pour les phases longues. Bundle toutes les actions en une seule liste finale.
- WebFetch + curl bloqués par le sandbox → demander à l'user les copier-coller des erreurs Vercel/Neon ou les screenshots.
- "Promote to Production" sur Vercel pas accessible API → toujours demander à l'user de cliquer.
- **SVG upload** dans le chat : limité par l'interface Claude Code. PNG/JPG fonctionnent.

## 🐛 Pièges rencontrés

1. Bouton "Copy" Clerk copie `KEY=value`, pas juste la valeur → préciser à l'user ne coller que la partie après le `=`
2. Vercel cache + Prisma → `prisma generate` dans le build script
3. Server components + Clerk auth() → `force-dynamic` obligatoire
4. Vercel "Redeploy of X" = même code source, pas le commit le plus récent
5. Prisma migrate deploy échoue P3005 si DB non baselinée → SQL manuels en attendant
6. DateTime Prisma ≠ string ISO : conversion explicite en `Date` requise au persist
7. v1 export inclut souvent un BDT en double (snapshot actif + archive) → dédup nécessaire
8. Vélos archivés v1 absents de la liste velos → phantom velos requis pour préserver historique BDT
9. **next-intl localePrefix='always' redirige aussi /api/** → pour les routes API, skip le middleware intl (route → 404 sinon `/fr-CA/api/...`)
10. **Helvetica PDF Type 1** ne supporte que Latin-1 → bullets `▸ ◆` et emojis `🚴 ⛑️ 💛` ne marchent pas. Solutions : (a) Inter font via CDN avec react-pdf, (b) HTML+Puppeteer avec Inter en CSS @import.
11. **@react-pdf/renderer** pénible pour pixel-perfect → migration vers HTML+Puppeteer (puppeteer-core + @sparticuz/chromium-min)

## 🔧 Stack courte référence

- Next.js 15.5 + React 19 + App Router + typedRoutes
- next-intl 3.26 (locales: fr-CA, en-CA, prefix always — skipped pour /api/)
- Clerk 6.12 + Organizations
- Prisma 5.22 + Postgres Neon (pgbouncer pooled / DATABASE_URL_UNPOOLED direct)
- Zod 3.23 pour validation API + actions
- Vitest 524 tests passing
- @react-pdf/renderer **retiré** au profit de :
- puppeteer-core + @sparticuz/chromium-min v148 (Chromium pack chargé depuis CDN GitHub)
- decimal.js pour précision monétaire
- Inter font via @import CSS (rsms.me)

Repo : https://github.com/yako-san/flex
Production : https://flex-tan.vercel.app/
