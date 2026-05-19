'use client';

import {
  WrenchIcon,
  CogIcon,
  ClockIcon,
  BanknoteIcon,
  PackageOpenIcon,
  ClipboardListIcon,
  LayoutDashboardIcon,
  UsersIcon,
  ArchiveIcon,
} from '@/components/icons';
import { Sidebar, type SidebarItem } from '@/components/ui/sidebar';

/*
 * Sidebar live preview pour ui-kit. Doit être Client Component car :
 *   1. Sidebar utilise usePathname (`use client`).
 *   2. Les références icônes (function components) ne sont
 *      pas sérialisables en props server→client. On déclare donc les
 *      items DANS le client pour éviter la frontière.
 */
const items: SidebarItem[] = [
  { href: '/admin/dashboard', icon: LayoutDashboardIcon, label: 'Tableau de bord' },
  { href: '/admin/inventaire', icon: WrenchIcon, label: 'Inventaire', badge: 7, badgeVariant: 'vert' },
  { href: '/admin/clients', icon: UsersIcon, label: 'Clients' },
  { href: '/admin/pieces', icon: CogIcon, label: 'Pièces', badge: 49, badgeVariant: 'rouge' },
  { href: '/admin/services', icon: ClockIcon, label: 'Services' },
  { href: '/admin/ventes', icon: BanknoteIcon, label: 'Ventes', badge: 1, badgeVariant: 'rouge' },
  { href: '/admin/reception', icon: PackageOpenIcon, label: 'Réception' },
  { href: '/admin/commandes', icon: ClipboardListIcon, label: 'Commandes' },
  { href: '/admin/archives', icon: ArchiveIcon, label: 'Archives' },
];

export function SidebarPreview() {
  return (
    <Sidebar
      items={items}
      versionLabel={
        <>
          v2.0.0<br />demo
        </>
      }
      loginInitial="yk"
      loginTitle="ui-kit preview"
    />
  );
}
