import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { AdminMobileTopBar, AdminSidebar, AdminWorkshopBar } from './_admin-nav';
import { getActiveWorkshop } from '@/lib/workshop';
import { prisma } from '@/lib/db';

/** Compteurs sidebar V1 (badges numériques sur Inventaire/Ventes/Pièces). */
async function getSidebarBadges(workshopId: string): Promise<{
  inventaire: number;
  ventes: number;
  pieces: number;
}> {
  try {
    const [bdtActifs, ventesAFacturer, piecesEpuisees] = await Promise.all([
      prisma.bdc.count({
        where: { workshopId, deletedAt: null, archiveStatus: 'ACTIF' },
      }),
      prisma.venteDirecte.count({
        where: { workshopId, deletedAt: null, factureNumero: null },
      }),
      prisma.piece.count({
        where: { workshopId, deletedAt: null, stockPhysique: { lte: 0 } },
      }),
    ]);
    return { inventaire: bdtActifs, ventes: ventesAFacturer, pieces: piecesEpuisees };
  } catch {
    return { inventaire: 0, ventes: 0, pieces: 0 };
  }
}

export const dynamic = 'force-dynamic';

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

async function safeAuth(): Promise<{ userId: string | null; clerkOk: boolean }> {
  if (!process.env['CLERK_SECRET_KEY']) {
    return { userId: null, clerkOk: false };
  }
  try {
    const { userId } = await auth();
    return { userId: userId ?? null, clerkOk: true };
  } catch {
    return { userId: null, clerkOk: false };
  }
}

async function safeWorkshop(): Promise<{
  workshop: Awaited<ReturnType<typeof getActiveWorkshop>>;
  dbOk: boolean;
}> {
  try {
    const workshop = await getActiveWorkshop();
    return { workshop, dbOk: true };
  } catch {
    return { workshop: null, dbOk: false };
  }
}

export default async function AdminLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { userId, clerkOk } = await safeAuth();

  if (!clerkOk) {
    return (
      <DegradedLayout
        locale={locale}
        message="Auth Clerk indisponible (variables d'environnement manquantes ou service down)."
      >
        {children}
      </DegradedLayout>
    );
  }

  if (!userId) redirect(`/${locale}/sign-in`);

  const { workshop, dbOk } = await safeWorkshop();
  const badges = workshop
    ? await getSidebarBadges(workshop.id)
    : { inventaire: 0, ventes: 0, pieces: 0 };

  return (
    /* Fond global gris V1 (#929292). Layout flex row desktop, colonne mobile. */
    <div
      className="min-h-screen bg-[var(--app-bg)] md:flex md:h-screen md:overflow-hidden md:p-5"
      style={{ gap: '20px' }}
    >
      {/* Top bar mobile (< md) — pill jaune comme V1 */}
      <AdminMobileTopBar locale={locale} badges={badges} />

      {/* Wrapper sidebar desktop — maintient 60px dans le flux flex.
          La sidebar elle-même se positionne en absolute lors du hover-expand
          pour ne pas pousser le contenu. */}
      <div
        className="relative hidden shrink-0 self-stretch md:block"
        style={{ width: 'var(--sidebar-w-collapsed)' }}
      >
        <AdminSidebar locale={locale} badges={badges} />
      </div>

      {/* Panneau principal — verre sombre V1 (rgba(0,0,0,0.20) sur #929292).
          data-admin-theme="dark" → CSS vars texte basculées en blanc-alpha. */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden md:rounded-[50px] md:bg-black/20" data-admin-theme="dark">
        <AdminWorkshopBar workshopName={workshop?.name ?? null} />

        <main className="flex-1 overflow-auto">
          {!dbOk ? (
            <div
              role="alert"
              className="mx-6 mt-4 rounded-xl border border-[#ffeaa7] bg-[#fff3cd] px-4 py-2 text-sm"
            >
              ⚠️ Base de données indisponible — certaines pages peuvent être
              incomplètes.{' '}
              <Link href={`/${locale}/dev/health`} className="text-[var(--jaune-h)] hover:underline">
                Voir le diagnostic →
              </Link>
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}

function DegradedLayout({
  children,
  locale,
  message,
}: {
  children: ReactNode;
  locale: string;
  message: string;
}) {
  return (
    <div className="min-h-screen bg-[var(--app-bg)]">
      <div
        role="alert"
        className="flex items-center justify-between gap-4 border-b border-[#ffeaa7] bg-[#fff3cd] px-6 py-2 text-sm"
      >
        <span>⚠️ Mode dégradé : {message}</span>
        <Link
          href={`/${locale}/dev/health`}
          className="font-semibold text-[var(--jaune-h)] no-underline"
        >
          Diagnostic →
        </Link>
      </div>
      <main className="p-8">{children}</main>
    </div>
  );
}
