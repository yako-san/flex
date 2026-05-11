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
  { href: 'admin/bdcs', label: 'Bons de travail' },
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
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '240px 1fr',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <aside
        style={{
          background: '#f5f5f5',
          borderRight: '1px solid #e0e0e0',
          padding: '1.5rem 1rem',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Flex</div>
          <OrganizationSwitcher
            hidePersonal
            createOrganizationMode="modal"
            appearance={{
              elements: { rootBox: { width: '100%' }, organizationSwitcherTrigger: { width: '100%', justifyContent: 'flex-start' } },
            }}
          />
          <div style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.4rem' }}>
            {workshop
              ? `Workshop : ${workshop.name}`
              : dbOk
              ? 'Aucun workshop lié'
              : 'DB indisponible'}
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={`/${locale}/${item.href}`}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: 4,
                textDecoration: 'none',
                color: '#1a1a1a',
                fontSize: '0.95rem',
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div
          style={{
            paddingTop: '1rem',
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <UserButton />
          <span style={{ fontSize: '0.85rem', color: '#666' }}>Mon compte</span>
        </div>
      </aside>

      <main style={{ padding: '2rem 2.5rem', overflow: 'auto' }}>
        {!dbOk ? (
          <div
            role="alert"
            style={{
              background: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: 8,
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              fontSize: '0.9rem',
            }}
          >
            ⚠️ Base de données indisponible — certaines pages peuvent être
            incomplètes.{' '}
            <Link href={`/${locale}/dev/health`} style={{ color: '#1565c0' }}>
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
