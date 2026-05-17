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
   * Garde la prop pour compat — la sidebar V1 n'a pas de hover-expand,
   * elle est en largeur fixe avec icône+label vertical centré.
   */
  expandedByDefault?: boolean;
  /** Branding header haut (ex: logo + version). */
  header?: React.ReactNode;
  /** Footer bas (ex: avatar Google + signOut). */
  footer?: React.ReactNode;
};

/**
 * Sidebar latérale jaune V1 — pill shape (border-radius 50px), 92px de
 * large fixe. Items en **colonne** (icône au-dessus, label CAPS dessous)
 * avec séparateurs `<hr>` entre items. Badges en overlay top-right de
 * l'icône.
 *
 * Différence V1 vs V2 historique :
 * - V1 : layout vertical compact, label TOUJOURS visible
 * - V2 historique : layout horizontal + hover-expand pour révéler le label
 *
 * Conformité capture 00c-menu-ouvert-v1.png.
 */
export function Sidebar({ items, header, footer }: Props) {
  const pathname = usePathname() ?? '';

  return (
    <aside
      className={cn(
        'hidden h-full flex-col items-stretch bg-[var(--jaune)] py-3 text-black md:flex',
        'rounded-[50px] shadow-[0_6px_12px_rgba(0,0,0,0.23)]',
        'w-[var(--sidebar-w-collapsed)]',
      )}
      aria-label="Navigation principale"
    >
      {header ? <div className="px-2 pb-3 text-center">{header}</div> : null}

      <nav className="flex flex-1 flex-col items-stretch overflow-y-auto px-2">
        {items.map((it, idx) => {
          const matchKey = it.matchPrefix ?? it.href;
          const active =
            pathname === it.href ||
            pathname.startsWith(`${matchKey}/`) ||
            pathname.startsWith(matchKey);
          const Icon = it.icon;
          return (
            <React.Fragment key={it.href}>
              {idx > 0 ? (
                <hr
                  className="mx-3 my-1 border-0"
                  style={{ borderTop: '1px solid rgba(154,123,79,0.3)' }}
                  aria-hidden
                />
              ) : null}
              <Link
                href={it.href as never}
                className={cn(
                  'group relative flex flex-col items-center justify-center gap-1 rounded-2xl py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40',
                  active
                    ? 'bg-[#9a7b4f] text-[var(--jaune)]'
                    : 'text-[#9a7b4f] hover:bg-black/10',
                )}
                aria-current={active ? 'page' : undefined}
              >
                {/* Container icône + badge overlay (top-right) */}
                <span className="relative inline-flex">
                  <Icon size={22} className="shrink-0" aria-hidden />
                  {it.badge != null && it.badge > 0 ? (
                    <span
                      className={cn(
                        'absolute -right-2 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none ring-2 ring-[var(--jaune)]',
                        it.badgeVariant === 'vert' &&
                          'bg-[var(--st-on-bench-bg)] text-black',
                        it.badgeVariant === 'rouge' &&
                          'bg-[var(--rouge)] text-white',
                        (!it.badgeVariant || it.badgeVariant === 'jaune') &&
                          'bg-black text-[var(--jaune)]',
                      )}
                      aria-label={`${it.badge} ${it.label}`}
                    >
                      {it.badge > 99 ? '99+' : it.badge}
                    </span>
                  ) : null}
                </span>

                {/* Label CAPS sous l'icône */}
                <span className="truncate text-[9px] font-bold uppercase tracking-[0.05em]">
                  {it.label}
                </span>
              </Link>
            </React.Fragment>
          );
        })}
      </nav>

      {footer ? <div className="mt-auto px-2 pt-2">{footer}</div> : null}
    </aside>
  );
}
