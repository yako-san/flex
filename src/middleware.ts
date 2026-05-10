import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createIntlMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

// Routes publiques (pas besoin de session Clerk).
// Exporté pour permettre tests unitaires sans bootstrap complet du middleware.
export const PUBLIC_ROUTES = [
  '/',
  '/:locale',
  '/:locale/sign-in(.*)',
  '/:locale/sign-up(.*)',
  '/:locale/dev/(.*)',  // doc UI publique (Sprint 4 — voir /dev/ui-kit)
  '/api/health',
  '/api/workshop/logo',
] as const;

const isPublicRoute = createRouteMatcher([...PUBLIC_ROUTES]);

const CLERK_KEY = process.env['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'];

// Les routes /api/* n'ont pas de préfixe locale et ne passent PAS par le
// middleware next-intl (sinon redirigées vers /fr-CA/api/... → 404).
function isApiRoute(req: NextRequest): boolean {
  return req.nextUrl.pathname.startsWith('/api/');
}

// Middleware composé : i18n + auth Clerk (Clerk sauté si non configuré).
const middleware = CLERK_KEY
  ? clerkMiddleware(async (auth, req) => {
      // Pour les routes API : pas d'intl, juste l'auth Clerk
      if (isApiRoute(req)) {
        if (!isPublicRoute(req)) await auth.protect();
        return; // laisse Next router vers la route handler
      }
      // Pour le reste : i18n + auth combinés
      const intlResponse = intlMiddleware(req);
      if (!isPublicRoute(req)) await auth.protect();
      return intlResponse;
    })
  : (req: NextRequest) => {
      if (isApiRoute(req)) return;
      return intlMiddleware(req);
    };

export default middleware;

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
    '/(api|trpc)(.*)',
  ],
};
