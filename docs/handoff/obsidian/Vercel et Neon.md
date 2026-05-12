# Vercel et Neon

## Vercel

### Projet

- **Nom** : `flex` (pas `flex-app`)
- **Équipe** : `yako-sans-projects` (avec `s` — c'est l'org name Vercel)
- **URL prod stable** : <https://flex-tan.vercel.app> (suit `main`)

### URLs preview branche

Format : `https://flex-git-<slug-branche>-yako-sans-projects.vercel.app`

Vercel tronque les slugs de branche à 63 caractères + ajoute un hash 6 chars
si nécessaire. Ex pour la branche `claude/sprint4-phase-3.11b-settings-hub` :
`flex-git-claude-sprint4-phase-311b-se-3d0795-yako-sans-projects.vercel.app`.

### Deployment Protection

**Activée**. Les URLs preview retournent `403 host_not_allowed` sans cookie
Vercel. 3 façons d'accéder :

1. **PR → comment Vercel bot** : contient l'URL signée qui contourne la
   protection (le plus simple)
2. **Vercel dashboard → Deployments → Visit** : ouvre l'URL avec le cookie
3. **Désactiver Deployment Protection** dans Project Settings → mais expose
   tous les previews publics (pas recommandé)

## Neon

### Deux projets distincts

| Projet | Branche | Usage | Migrations |
|---|---|---|---|
| **`flex-prod`** | `main` | **VRAIE prod**, branchée Vercel | ⚠ Appliquer ici |
| `flex-v2` | `production` | Dev/test, jamais utilisé par Vercel | NE PAS migrer ici |

Hostname `flex-prod` : `ep-broad-queen-anac9vrl-pooler.c-6.us-east-1.aws.neon.tech`.

### Appliquer une migration SQL

1. <https://console.neon.tech/>
2. Projet `flex-prod`
3. Branche `main`
4. Onglet **SQL Editor**
5. Coller le SQL du fichier migration
6. Exécuter
7. Confirmer dans `\dt` ou via une SELECT que la table existe

### `DATABASE_URL` Vercel

Gérée par l'intégration Vercel-Neon. Pas éditable directement dans Vercel UI
(juste « Manage Connection » / « Rotate »). Si tu veux changer la DB pointée
par Vercel : passer par Neon → connexion.

### Pourquoi 2 projets ?

Historique. `flex-v2` = première DB, branchée à `flex` initialement. Quand
yako-san a voulu un séparation prod/dev claire, il a créé `flex-prod` et
re-pointé Vercel dessus. `flex-v2` reste comme sandbox local pour les
sessions Claude qui veulent tester des migrations sans risque.

Voir [[Stack technique]] pour le contexte global.

## OAuth Google (Sprint 2.7)

- Client OAuth créé dans Google Cloud projet `flex-rev` (V1)
- Scope : `gmail.compose` (création brouillon uniquement, pas envoi)
- Redirect URIs Google Cloud :
  - `https://flex-tan.vercel.app/api/auth/google/callback`
  - `http://localhost:3001/api/auth/google/callback`
- Env vars Vercel : `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_OAUTH_SCOPES`
- Refresh token stocké en clair dans `Workshop.googleRefreshToken` (à chiffrer
  en Sprint billing)

## Vercel Blob (Sprint 2.8)

- Store **Public** créé sur Vercel projet `flex`
- Env var injectée : `BLOB_READ_WRITE_TOKEN`
- URLs publiques avec token random dans le path → servables directement
  dans PDF/emails sans proxy auth

## Liens

- [[Workflow git]]
- [[Sprint 2.8 photos]]
- [[Stack technique]]
