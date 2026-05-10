'use client';

import {
  Wrench,
  Cog,
  Clock,
  Banknote,
  PackageOpen,
  ClipboardList,
  LayoutDashboard,
  Users,
  Archive,
} from 'lucide-react';
import { Sidebar, type SidebarItem } from '@/components/ui/sidebar';

/*
 * Sidebar live preview pour ui-kit. Doit être Client Component car :
 *   1. Sidebar utilise usePathname (`use client`).
 *   2. Les références icônes Lucide (function components) ne sont
 *      pas sérialisables en props server→client. On déclare donc les
 *      items DANS le client pour éviter la frontière.
 */
const items: SidebarItem[] = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { href: '/admin/inventaire', icon: Wrench, label: 'Inventaire', badge: 7, badgeVariant: 'vert' },
  { href: '/admin/clients', icon: Users, label: 'Clients' },
  { href: '/admin/pieces', icon: Cog, label: 'Pièces', badge: 49, badgeVariant: 'rouge' },
  { href: '/admin/services', icon: Clock, label: 'Services' },
  { href: '/admin/ventes', icon: Banknote, label: 'Ventes', badge: 1, badgeVariant: 'rouge' },
  { href: '/admin/reception', icon: PackageOpen, label: 'Réception' },
  { href: '/admin/commandes', icon: ClipboardList, label: 'Commandes' },
  { href: '/admin/archives', icon: Archive, label: 'Archives' },
];

export function SidebarPreview() {
  return (
    <Sidebar
      items={items}
      header={
        <div className="space-y-1">
          <div className="text-2xl font-bold tracking-tight">F/V</div>
          <div className="text-[10px] opacity-70">v2.0.0</div>
        </div>
      }
      footer={
        <div className="flex h-9 items-center justify-center rounded-full bg-black/15 text-xs font-bold">
          yk
        </div>
      }
    />
  );
}
