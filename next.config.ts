import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  // Le client Prisma doit rester côté Node, jamais bundlé.
  // puppeteer-core + @sparticuz/chromium-min doivent rester externes (binaire
  // Chromium chargé depuis CDN au runtime).
  serverExternalPackages: [
    '@prisma/client',
    'decimal.js',
    'puppeteer-core',
    '@sparticuz/chromium-min',
  ],
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default withNextIntl(nextConfig);
