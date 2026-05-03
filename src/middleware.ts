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
  '/api/health',
] as const;

const isPublicRoute = createRouteMatcher([...PUBLIC_ROUTES]);

const CLERK_KEY = process.env['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'];

// Middleware composé : i18n + auth Clerk (Clerk sauté si non configuré).
const middleware = CLERK_KEY
  ? clerkMiddleware(async (auth, req) => {
      const intlResponse = intlMiddleware(req);
      if (!isPublicRoute(req)) await auth.protect();
      return intlResponse;
    })
  : (req: NextRequest) => intlMiddleware(req);

export default middleware;

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
    '/(api|trpc)(.*)',
  ],
};
