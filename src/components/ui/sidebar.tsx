'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export type SidebarItem = {
  href: string;
  /** Doit pointer vers la racine d'une route (matched par startsWith). */
  matchPrefix?: string;
  icon: LucideIcon;
  label: string;
  /** Compteur affiché en pastille (ex: BDT actifs). `null|undefined` = caché. */
  badge?: number | null;
  /**
   * Couleur de la pastille. Défaut : neutre (jaune sur dark).
   * Variantes V1 : `vert` (BDT actifs), `rouge` (alertes), `jaune` (par défaut).
   */
  badgeVariant?: 'jaune' | 'vert' | 'rouge';
};

type Props = {
  items: SidebarItem[];
  /**
   * Si true, sidebar reste expanded (200px) en permanence — pattern
   * V1 sur `/dashboard`. Sinon, collapsed (60px) avec hover-expand.
   */
  expandedByDefault?: boolean;
  /** Branding header haut (ex: logo + version). */
  header?: React.ReactNode;
  /** Footer bas (ex: avatar Google + signOut). */
  footer?: React.ReactNode;
};

/**
 * Sidebar latérale jaune V1, double-état :
 * - collapsed (60px) par défaut hors `/dashboard`
 * - expanded (200px) si `expandedByDefault` ou hover prolongé.
 *
 * Mobile : la sidebar passe en `<header>` horizontal via media-query CSS
 * (à câbler dans la page parent — ou wrapper `<MobileNav>` dédié).
 */
export function Sidebar({ items, expandedByDefault = false, header, footer }: Props) {
  const pathname = usePathname() ?? '';
  const [hovered, setHovered] = React.useState(false);
  const expanded = expandedByDefault || hovered;

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-expanded={expanded}
      className={cn(
        'fixed left-0 top-0 z-40 hidden h-screen flex-col items-stretch bg-[var(--jaune)] py-3 text-black shadow-md transition-[width] duration-200 md:flex',
        expanded ? 'w-[var(--sidebar-w-expanded)]' : 'w-[var(--sidebar-w-collapsed)]',
      )}
      aria-label="Navigation principale"
    >
      {header ? <div className="px-2 pb-3 text-center">{header}</div> : null}

      <nav className="flex flex-1 flex-col gap-1 px-2">
        {items.map((it) => {
          const matchKey = it.matchPrefix ?? it.href;
          const active = pathname === it.href || pathname.startsWith(`${matchKey}/`) || pathname.startsWith(matchKey);
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href as never}
              className={cn(
                'group relative flex h-11 items-center gap-3 overflow-hidden rounded-lg px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40',
                active
                  ? 'bg-black/15 font-bold'
                  : 'hover:bg-black/10',
              )}
              aria-current={active ? 'page' : undefined}
              title={!expanded ? it.label : undefined}
            >
              <Icon size={20} className="shrink-0" aria-hidden />
              <span
                className={cn(
                  'truncate text-sm transition-opacity',
                  expanded ? 'opacity-100' : 'opacity-0',
                )}
              >
                {it.label}
              </span>
              {it.badge != null && it.badge > 0 ? (
                <span
                  className={cn(
                    'ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none',
                    it.badgeVariant === 'vert' && 'bg-[var(--st-on-bench-bg)] text-black',
                    it.badgeVariant === 'rouge' && 'bg-[var(--rouge)] text-white',
                    (!it.badgeVariant || it.badgeVariant === 'jaune') && 'bg-black text-[var(--jaune)]',
                  )}
                  aria-label={`${it.badge} ${it.label}`}
                >
                  {it.badge > 99 ? '99+' : it.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {footer ? <div className="mt-auto px-2 pt-2">{footer}</div> : null}
    </aside>
  );
}
