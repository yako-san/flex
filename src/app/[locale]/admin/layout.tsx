import { auth } from '@clerk/nextjs/server';
import { OrganizationSwitcher, UserButton } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { getActiveWorkshop } from '@/lib/workshop';

export const dynamic = 'force-dynamic';

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

const navItems = [
  { href: 'admin', label: 'Tableau de bord' },
  { href: 'admin/clients', label: 'Clients' },
  { href: 'admin/velos', label: 'Vélos' },
  { href: 'admin/inventaire', label: 'Bons de travail' },
  { href: 'admin/pieces', label: 'Pièces' },
  { href: 'admin/services', label: 'Services' },
  { href: 'admin/forfaits', label: 'Forfaits' },
  { href: 'admin/marques', label: 'Marques' },
  { href: 'admin/equipe', label: 'Équipe' },
  { href: 'admin/pos', label: 'Commandes (POs)' },
  { href: 'admin/ventes', label: 'Ventes comptoir' },
  { href: 'admin/import', label: 'Import v1' },
  { href: 'admin/legacy-v1', label: 'Données v1 brutes' },
  { href: 'admin/settings', label: 'Paramètres' },
  { href: 'admin/maintenance', label: 'Maintenance' },
  { href: 'admin/settings/ui-kit', label: 'UI Kit (dev)' },
];

/**
 * Helper défensif : appelle `auth()` Clerk en wrapping toute exception
 * (ENV manquante, Clerk service down, etc.). Retourne `clerkOk: false`
 * au lieu de crash 500.
 */
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

/**
 * Helper défensif sur DB : retourne `dbOk: false` au lieu de crash si la
 * DB ne répond pas (preview Vercel mal configurée, Neon en sleep, etc.).
 */
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

  // Mode dégradé : Clerk indisponible (preview sans env, dev sans clés).
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
    <div className="grid min-h-screen lg:grid-cols-[240px_1fr]" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <aside
        className="flex flex-col border-b border-r-0 border-[var(--gris-bord)] bg-[var(--gris-fond)] p-4 lg:border-b-0 lg:border-r lg:p-6"
        aria-label="Navigation principale"
      >
        <div className="mb-4 lg:mb-6">
          <div className="mb-2 text-base font-bold">Flex</div>
          <OrganizationSwitcher
            hidePersonal
            createOrganizationMode="modal"
            appearance={{
              elements: {
                rootBox: { width: '100%' },
                organizationSwitcherTrigger: { width: '100%', justifyContent: 'flex-start' },
              },
            }}
          />
          <div className="mt-1 text-xs text-[var(--text-secondary-60)]">
            {workshop
              ? `Workshop : ${workshop.name}`
              : dbOk
              ? 'Aucun workshop lié'
              : 'DB indisponible'}
          </div>
        </div>

        <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-1 lg:flex-col" aria-label="Sections admin">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={`/${locale}/${item.href}`}
              className="whitespace-nowrap rounded px-3 py-1.5 text-sm text-[var(--dark)] no-underline transition-colors hover:bg-[var(--jaune)]/30 focus-visible:bg-[var(--jaune)]/30 lg:py-2"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-3 flex items-center gap-3 border-t border-[var(--gris-bord)] pt-3 lg:mt-0 lg:pt-4">
          <UserButton />
          <span className="text-sm text-[var(--text-secondary-60)]">Mon compte</span>
        </div>
      </aside>

      <main className="overflow-auto p-4 sm:p-6 lg:p-8">
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
    <div
      style={{
        minHeight: '100vh',
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        background: '#fafafa',
      }}
    >
      <div
        role="alert"
        style={{
          background: '#fff3cd',
          borderBottom: '1px solid #ffeaa7',
          padding: '0.75rem 1.5rem',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <span>⚠️ Mode dégradé : {message}</span>
        <Link
          href={`/${locale}/dev/health`}
          style={{ color: '#1565c0', fontWeight: 600, textDecoration: 'none' }}
        >
          Diagnostic →
        </Link>
      </div>
      <main style={{ padding: '2rem 2.5rem' }}>{children}</main>
    </div>
  );
}
