import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

// Locales supportées au lancement v2.
// fr-CA = défaut (Québec). en-CA pour les ateliers anglophones canadiens.
// Les locales additionnelles (es-MX, fr-FR, etc) seront ajoutées par tenant
// quand on étendra hors-Canada (cf. Workshop.activeLocales en DB).
//
// localePrefix='always' : toutes les URLs ont le préfixe /fr-CA ou /en-CA.
// Plus prévisible que 'as-needed' (qui posait des soucis de routing à la
// racine "/" sur Vercel). La racine "/" redirige automatiquement vers la
// defaultLocale via le middleware.
export const routing = defineRouting({
  locales: ['fr-CA', 'en-CA'],
  defaultLocale: 'fr-CA',
  localePrefix: 'always',
});

export type AppLocale = (typeof routing.locales)[number];

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
