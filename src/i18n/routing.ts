import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

// Locales supportées au lancement v2.
// fr-CA = défaut (Québec). en-CA pour les ateliers anglophones canadiens.
// Les locales additionnelles (es-MX, fr-FR, etc) seront ajoutées par tenant
// quand on étendra hors-Canada (cf. Workshop.activeLocales en DB).
export const routing = defineRouting({
  locales: ['fr-CA', 'en-CA'],
  defaultLocale: 'fr-CA',
  localePrefix: 'as-needed', // /fr-CA est implicite, /en-CA explicite
});

export type AppLocale = (typeof routing.locales)[number];

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
