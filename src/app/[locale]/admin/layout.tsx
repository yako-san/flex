import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { AdminMobileTopBar, AdminSidebar, AdminWorkshopBar } from './_admin-nav';
import { getActiveWorkshop } from '@/lib/workshop';

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

  return (
    <div className="min-h-screen">
      {/* Sidebar fixe latérale jaune V1 (desktop ≥ md). Hover-expand. */}
      <AdminSidebar locale={locale} />

      {/* Header mobile avec hamburger drawer (< md) */}
      <AdminMobileTopBar locale={locale} />

      {/* Workshop info bar (desktop, sticky en haut du contenu) */}
      <AdminWorkshopBar workshopName={workshop?.name ?? null} />

      {/* Contenu principal — padding-left adapté à la sidebar */}
      <main
        className="overflow-auto p-4 sm:p-6 md:p-8"
        style={{ paddingLeft: 'var(--sidebar-w-collapsed)' }}
      >
        <div className="md:pl-6">
          {!dbOk ? (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-[#ffeaa7] bg-[#fff3cd] px-4 py-2 text-sm"
            >
              ⚠️ Base de données indisponible — certaines pages peuvent être
              incomplètes.{' '}
              <Link href={`/${locale}/dev/health`} className="text-[var(--jaune-h)] hover:underline">
                Voir le diagnostic →
              </Link>
            </div>
          ) : null}
          {children}
        </div>
      </main>
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
    <div className="min-h-screen bg-[var(--gris-fond)]" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
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
