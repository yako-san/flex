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
 * Sidebar latérale jaune V1 — pill shape (border-radius 50px).
 *
 * Desktop : intégrée dans le flux flex du layout (pas fixed).
 * - collapsed (60px) : position relative, occupe 60px dans le flex.
 * - hover-expand (200px) : position absolute, overlay sans pousser le contenu.
 *   Reproduit exactement le pattern AppShell V1.
 *
 * Mobile : invisible (la SidebarMobileDrawer prend le relais).
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
        'hidden flex-col items-stretch bg-[var(--jaune)] py-3 text-black transition-[width] duration-300 md:flex',
        'rounded-[50px]',
        /* Hover-expand : absolute pour ne pas pousser le contenu */
        hovered && !expandedByDefault
          ? 'absolute inset-y-0 left-0 z-40 shadow-[0_12px_32px_rgba(0,0,0,0.40)]'
          : 'h-full shadow-[0_6px_12px_rgba(0,0,0,0.23)]',
        expanded ? 'w-[var(--sidebar-w-expanded)]' : 'w-[var(--sidebar-w-collapsed)]',
      )}
      style={{ overflow: 'hidden' }}
      aria-label="Navigation principale"
    >
      {header ? <div className="px-2 pb-3 text-center">{header}</div> : null}

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2">
        {items.map((it) => {
          const matchKey = it.matchPrefix ?? it.href;
          const active = pathname === it.href || pathname.startsWith(`${matchKey}/`) || pathname.startsWith(matchKey);
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href as never}
              className={cn(
                'group relative flex h-11 items-center gap-3 overflow-hidden rounded-full px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40',
                active
                  ? 'bg-[#9a7b4f] text-[var(--jaune)]'
                  : 'text-[#9a7b4f] hover:bg-black/10',
              )}
              aria-current={active ? 'page' : undefined}
              title={!expanded ? it.label : undefined}
            >
              <Icon size={20} className="shrink-0" aria-hidden />
              <span
                className={cn(
                  'truncate text-sm font-bold uppercase tracking-[0.05em] transition-opacity',
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
