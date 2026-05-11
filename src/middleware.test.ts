import { describe, it, expect } from 'vitest';
import { createRouteMatcher } from '@clerk/nextjs/server';
import { PUBLIC_ROUTES } from './middleware';

// Reconstruit un matcher à partir de la liste exportée pour tester en isolation.
const isPublic = createRouteMatcher([...PUBLIC_ROUTES]);

const req = (pathname: string) =>
  ({
    nextUrl: { pathname },
    url: `http://localhost${pathname}`,
  }) as never;

describe('middleware PUBLIC_ROUTES', () => {
  it.each([
    '/',
    '/fr-CA',
    '/en-CA',
    '/fr-CA/sign-in',
    '/fr-CA/sign-in/factor-one',
    '/en-CA/sign-up',
    '/en-CA/sign-up/verify-email-address',
    '/fr-CA/dev/ui-kit',
    '/en-CA/dev/ui-kit',
    '/api/health',
  ])('considère %s comme public', (path) => {
    expect(isPublic(req(path))).toBe(true);
  });

  it.each([
    '/fr-CA/dashboard',
    '/en-CA/dashboard',
    '/fr-CA/dashboard/clients',
    '/fr-CA/admin',
    '/api/admin/import-v1',
    '/api/workshops',
  ])('considère %s comme protégé', (path) => {
    expect(isPublic(req(path))).toBe(false);
  });
});
