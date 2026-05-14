import { auth } from '@clerk/nextjs/server';
import { OrganizationSwitcher, UserButton } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import {
  LayoutDashboard,
  Users,
  Bike,
  Wrench,
  Package,
  Layers,
  Boxes,
  Tag,
  UserCog,
  Truck,
  ShoppingCart,
  Upload,
  Database,
  Settings,
  Hammer,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { Sidebar, type SidebarItem } from '@/components/ui/sidebar';
import { SidebarMobileDrawer } from '@/components/ui/sidebar-mobile-drawer';
import { getActiveWorkshop } from '@/lib/workshop';

export const dynamic = 'force-dynamic';

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

function buildNavItems(locale: string): SidebarItem[] {
  return [
    { href: `/${locale}/admin`,                matchPrefix: `/${locale}/admin`,             icon: LayoutDashboard, label: 'Tableau de bord' },
    { href: `/${locale}/admin/bdcs`,           matchPrefix: `/${locale}/admin/inventaire`,  icon: Wrench,          label: 'Inventaire' },
    { href: `/${locale}/admin/clients`,        matchPrefix: `/${locale}/admin/clients`,     icon: Users,           label: 'Clients' },
    { href: `/${locale}/admin/velos`,          matchPrefix: `/${locale}/admin/velos`,       icon: Bike,            label: 'Vélos' },
    { href: `/${locale}/admin/pieces`,         matchPrefix: `/${locale}/admin/pieces`,      icon: Package,         label: 'Pièces' },
    { href: `/${locale}/admin/services`,       matchPrefix: `/${locale}/admin/services`,    icon: Layers,          label: 'Services' },
    { href: `/${locale}/admin/forfaits`,       matchPrefix: `/${locale}/admin/forfaits`,    icon: Boxes,           label: 'Forfaits' },
    { href: `/${locale}/admin/marques`,        matchPrefix: `/${locale}/admin/marques`,     icon: Tag,             label: 'Marques' },
    { href: `/${locale}/admin/equipe`,         matchPrefix: `/${locale}/admin/equipe`,      icon: UserCog,         label: 'Équipe' },
    { href: `/${locale}/admin/pos`,            matchPrefix: `/${locale}/admin/pos`,         icon: Truck,           label: 'Commandes' },
    { href: `/${locale}/admin/ventes`,         matchPrefix: `/${locale}/admin/ventes`,      icon: ShoppingCart,    label: 'Ventes' },
    { href: `/${locale}/admin/aide`,           matchPrefix: `/${locale}/admin/aide`,        icon: HelpCircle,      label: 'Aide' },
    { href: `/${locale}/admin/settings`,       matchPrefix: `/${locale}/admin/settings`,    icon: Settings,        label: 'Paramètres' },
    { href: `/${locale}/admin/import`,         matchPrefix: `/${locale}/admin/import`,      icon: Upload,          label: 'Import v1' },
    { href: `/${locale}/admin/legacy-v1`,      matchPrefix: `/${locale}/admin/legacy-v1`,   icon: Database,        label: 'Dump v1' },
    { href: `/${locale}/admin/maintenance`,    matchPrefix: `/${locale}/admin/maintenance`, icon: Hammer,          label: 'Maintenance' },
    { href: `/${locale}/admin/settings/ui-kit`,matchPrefix: `/${locale}/admin/settings/ui-kit`, icon: Sparkles,    label: 'UI Kit' },
  ];
}

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
  const navItems = buildNavItems(locale);

  return (
    <div className="min-h-screen">
      {/* Sidebar fixe latérale jaune V1 (desktop ≥ md). Hover-expand. */}
      <Sidebar
        items={navItems}
        header={
          <div className="flex flex-col items-center gap-1 py-2">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black text-[var(--jaune)] font-bold">
              F
            </div>
          </div>
        }
        footer={
          <div className="flex items-center justify-center pb-2">
            <UserButton appearance={{ elements: { rootBox: { display: 'flex', justifyContent: 'center' } } }} />
          </div>
        }
      />

      {/* Header mobile (visible < md) — hamburger ouvre le drawer */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-[var(--gris-bord)] bg-[var(--jaune)] px-3 py-2 md:hidden"
        aria-label="Barre mobile"
      >
        <div className="flex items-center gap-2">
          <SidebarMobileDrawer
            items={navItems}
            header={
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black text-[var(--jaune)] text-sm font-bold">
                  F
                </span>
                <span className="text-sm font-semibold uppercase tracking-wider">Flex</span>
              </div>
            }
            footer={
              <div className="flex items-center justify-center py-2">
                <UserButton />
              </div>
            }
          />
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black text-[var(--jaune)] text-sm font-bold">F</span>
          <span className="text-sm font-semibold uppercase tracking-wider">Flex</span>
        </div>
        <UserButton />
      </header>

      {/* Workshop info bar (desktop, sticky en haut du contenu) */}
      <div
        className="hidden items-center gap-3 border-b border-[var(--gris-bord)] bg-white/80 px-6 py-2 backdrop-blur md:flex"
        style={{ paddingLeft: 'calc(var(--sidebar-w-collapsed) + 1.5rem)' }}
      >
        <OrganizationSwitcher
          hidePersonal
          createOrganizationMode="modal"
          appearance={{
            elements: { organizationSwitcherTrigger: { padding: '4px 8px', borderRadius: 999 } },
          }}
        />
        <span className="text-xs text-[var(--text-secondary-60)]">
          {workshop
            ? `Workshop : ${workshop.name}`
            : dbOk
            ? 'Aucun workshop lié'
            : 'DB indisponible'}
        </span>
      </div>

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
