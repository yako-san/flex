'use client';

import { OrganizationSwitcher, UserButton } from '@clerk/nextjs';
import {
  Bike,
  Boxes,
  Database,
  Hammer,
  HelpCircle,
  Layers,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Sparkles,
  Tag,
  Truck,
  Upload,
  UserCog,
  Users,
  Wrench,
} from 'lucide-react';
import { Sidebar, type SidebarItem } from '@/components/ui/sidebar';
import { SidebarMobileDrawer } from '@/components/ui/sidebar-mobile-drawer';

// Client wrapper qui construit la navigation admin (Sidebar desktop +
// SidebarMobileDrawer mobile) avec les icônes Lucide.
//
// Pourquoi ce wrapper existe : les icônes Lucide sont des `forwardRef`,
// donc impossibles à sérialiser à travers la frontière Server → Client en
// build production. Quand le layout (Server Component) construisait
// `navItems` et passait `items[].icon` à `<Sidebar>` (Client Component),
// React jetait :
//
//   « Functions cannot be passed directly to Client Components unless
//     you explicitly expose it by marking it with "use server" »
//
// En dev Next.js est permissif et n'aboie pas. En `next start` après
// `next build`, le bundle RSC strict rejette. Le bug a survécu plusieurs
// semaines parce que la prod Vercel servait un vieux build (avant Sprint 4)
// suite à une Production Branch mal configurée — voir docs/handoff/primer.md.
//
// Fix : construire `navItems` dans un Client Component. Le layout passe
// uniquement `locale` (string sérialisable) + booléen `workshopOk`.

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

/** Sidebar desktop (≥ md, fixed left). */
export function AdminSidebar({ locale }: { locale: string }) {
  const navItems = buildNavItems(locale);
  return (
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
          <UserButton
            appearance={{
              elements: { rootBox: { display: 'flex', justifyContent: 'center' } },
            }}
          />
        </div>
      }
    />
  );
}

/** Barre top mobile (< md) avec hamburger + logo + UserButton. */
export function AdminMobileTopBar({ locale }: { locale: string }) {
  const navItems = buildNavItems(locale);
  return (
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
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black text-[var(--jaune)] text-sm font-bold">
          F
        </span>
        <span className="text-sm font-semibold uppercase tracking-wider">Flex</span>
      </div>
      <UserButton />
    </header>
  );
}

/** Barre workshop (desktop ≥ md, sticky en haut du contenu). */
export function AdminWorkshopBar({ workshopName }: { workshopName: string | null }) {
  return (
    <div
      className="hidden items-center gap-3 border-b border-[rgba(0,0,0,0.15)] bg-[var(--gris-bg)] px-6 py-2 md:flex"
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
        {workshopName ? `Workshop : ${workshopName}` : 'Aucun workshop lié'}
      </span>
    </div>
  );
}
