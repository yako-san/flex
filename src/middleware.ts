import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createIntlMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

// Routes publiques (pas besoin de session Clerk).
const isPublicRoute = createRouteMatcher([
  '/',
  '/:locale',
  '/:locale/sign-in(.*)',
  '/:locale/sign-up(.*)',
  '/api/health',
]);

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
