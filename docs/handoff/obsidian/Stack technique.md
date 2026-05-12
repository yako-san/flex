# Stack technique

> Vue d'ensemble des libs V2.

## Frontend

- **Next.js 15.1** App Router + typedRoutes + Server Actions
- **React 19** (`useOptimistic`, `useActionState`)
- **TypeScript** strict
- **Tailwind CSS v4** (CSS-first, `@import "tailwindcss"`) + `@tailwindcss/postcss`
- **shadcn/ui** (New York) — Radix primitives (Dialog, Popover, Dropdown, etc.)
- **Lucide React** icônes (pas Heroidicons — V1 utilise Heroicons)
- **Sonner** toasts
- **next-intl 3.26** (fr-CA / en-CA, `localePrefix='always'`)

## Backend

- **Prisma 5.22** + Postgres (Neon `flex-prod`)
- **Server Actions** (la majorité) — pas d'API REST custom sauf legacy
- **Clerk 6.12** auth + Organizations (multi-tenant)
- **Nodemailer** (Gmail SMTP) + **Resend** (fallback)
- **Gmail API** brouillon hybride (Sprint 2.7)
- **`@vercel/blob`** storage photos BDT (Sprint 2.8)

## PDF / docs

- **puppeteer-core + @sparticuz/chromium-min** pour les PDFs facture/éval
- HTML → PDF (templates dans `src/lib/pdf-html/templates/`)

## Tests / qualité

- **Vitest 2.1** + happy-dom (optin par suffix `.dom.test.tsx`)
- **@testing-library/react** pour les hooks
- **`pnpm tsc --noEmit`** type-check
- **Pino** + Sentry (à venir) pour logging/errors

## Stack V1 comparable

V1 = Next.js 14 + Google Sheets API + Vercel KV + Gmail draft. V2 = stack
moderne Postgres-first. Voir [[Anti-patterns V1]] pour ce qu'on ne reproduit pas.

## Liens

- [[Vercel et Neon]]
- [[Tests setup]]
- [[Patterns Phase 2]]
