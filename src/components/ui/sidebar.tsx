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
   * V1 sur `/dashboard`. Sinon, collapsed (100px) avec hover-expand.
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
 * Dimensions confirmées par yako-san 2026-05-17 (cf. docs/handoff/SIDEBAR-SPEC.md
 * + note PR #80) :
 * - Fermée (collapsed) = **100px** (par défaut sur toutes les pages sauf
 *   Dashboard)
 * - Ouverte (expanded) = **200px** (hover OU `expandedByDefault` pour
 *   Dashboard)
 * - Pastilles internes = **60px** de diamètre (icônes, logo, avatar)
 *
 * Hover-expand : la sidebar passe en `position: absolute` au hover pour
 * NE PAS pousser le contenu de la page (overlay avec ombre approfondie).
 * Quand la souris part, retour à `relative` dans le flow.
 *
 * Items en mode collapsed = pastille brune 60px centrée + label CAPS
 * petit dessous (vertical). En mode expanded = pastille + label CAPS
 * normal à droite (horizontal).
 */
export function Sidebar({ items, expandedByDefault = false, header, footer }: Props) {
  const pathname = usePathname() ?? '';
  const [hovered, setHovered] = React.useState(false);
  const expanded = expandedByDefault || hovered;
  const overlay = hovered && !expandedByDefault;

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-expanded={expanded}
      className={cn(
        'hidden flex-col items-stretch bg-[var(--jaune)] py-3 text-black transition-[width,box-shadow] duration-300 ease-in-out md:flex',
        'rounded-[50px]',
        overlay
          ? 'absolute inset-y-0 left-0 z-40 shadow-[0_12px_32px_rgba(0,0,0,0.40)]'
          : 'h-full shadow-[0_6px_12px_rgba(0,0,0,0.23)]',
        expanded ? 'w-[var(--sidebar-w-expanded)]' : 'w-[var(--sidebar-w-collapsed)]',
      )}
      style={{ overflow: 'hidden' }}
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
                  'group relative flex rounded-2xl py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40',
                  // Mode collapsed = colonne (pastille au-dessus, label dessous).
                  // Mode expanded = ligne (pastille à gauche, label à droite).
                  expanded
                    ? 'flex-row items-center gap-3 px-2'
                    : 'flex-col items-center justify-center gap-1',
                  active
                    ? 'bg-[#9a7b4f] text-[var(--jaune)]'
                    : 'text-[#9a7b4f] hover:bg-black/10',
                )}
                aria-current={active ? 'page' : undefined}
                title={!expanded ? it.label : undefined}
              >
                {/* Pastille 60px ronde contenant l'icône + badge en overlay. */}
                <span
                  className="relative inline-flex shrink-0 items-center justify-center rounded-full"
                  style={{
                    width: 'var(--sidebar-pastille)',
                    height: 'var(--sidebar-pastille)',
                  }}
                >
                  <Icon size={26} className="shrink-0" aria-hidden />
                  {it.badge != null && it.badge > 0 ? (
                    <span
                      className={cn(
                        'absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none ring-2 ring-[var(--jaune)]',
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

                {/* Label CAPS — petit sous la pastille en mode collapsed,
                    plus grand à droite en mode expanded. */}
                <span
                  className={cn(
                    'truncate font-bold uppercase tracking-[0.05em] transition-opacity',
                    expanded ? 'text-sm' : 'text-[9px]',
                    expanded && overlay ? 'opacity-100' : '',
                  )}
                >
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
