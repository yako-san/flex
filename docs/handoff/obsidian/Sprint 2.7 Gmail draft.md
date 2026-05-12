# Sprint 2.7 — Gmail draft hybride

> **Statut : déjà implémenté côté code (backend + frontend).** Polish visuel
> tokens V1 inclus dans PR #18 (avec [[Sprint 2.8 photos]] bootstrap).

## Idée

Quand l'utilisateur veut envoyer un courriel (éval, facture, suivi) au client,
on propose 2 modes :

- **Brouillon Gmail** (défaut si OAuth connecté) — crée un brouillon dans le
  compte Gmail du workshop via Gmail API (scope `gmail.compose`). L'utilisateur
  ouvre Gmail, vérifie, clique Envoyer manuellement. **Filet de relecture
  V1**.
- **Envoyer maintenant** (fallback si pas de Gmail OAuth) — envoie direct
  via SMTP/Resend. Pas de filet de relecture.

## OAuth setup (déjà en place)

Voir [[Vercel et Neon]] section OAuth Google. Client Google Cloud projet
`flex-rev`, scope `gmail.compose`. Refresh token stocké dans
`Workshop.googleRefreshToken`.

UI connexion : `/admin/settings/atelier` → composant `GmailConnectionPanel`.

## Code

- `src/lib/email/send.ts` — fonction `sendEmail({ mode })` qui delegate vers
  `createGmailDraft` (mode='draft') ou SMTP/Resend (mode='send')
- `src/lib/email/gmail-draft.ts` — appel Gmail API (scope `gmail.compose`)
- `src/app/[locale]/admin/inventaire/[id]/email-actions.ts` — 3 actions
  serveur (`sendEvalEmailAction`, `sendFactureEmailAction`, `sendSuiviEmailAction`)
  qui acceptent `mode: 'send' | 'draft'`
- `email-buttons.tsx` — UI client avec toggle Brouillon/Envoyer si Gmail
  connecté

## Suite (hors scope cette PR)

Aucune. Le mode hybride fonctionne. À tester par yako-san une fois Gmail
OAuth connecté en prod.

## Liens

- [[Sprint 4 béta plus]]
- [[Vercel et Neon]]
