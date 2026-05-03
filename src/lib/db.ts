import { PrismaClient } from '@prisma/client';

// Pattern singleton pour Prisma en dev :
// Next.js hot-reload recrée le module à chaque sauvegarde, ce qui créerait
// N instances PrismaClient → "Too many connections" sur Neon.
// On stocke l'instance sur globalThis en dev (jamais en prod où il n'y a pas
// de hot-reload).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
