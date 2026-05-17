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
   * Vrai sur Dashboard (/admin) — sidebar 200pt dans le flow par défaut, pas
   * de hover-expand. Sur les autres pages : 100pt fermée + hover-expand 200pt
   * en absolute pour ne pas pousser le contenu.
   */
  expandedByDefault?: boolean;
  /** Branding header haut (ex: logo pastille 60pt + popover). */
  header?: React.ReactNode;
  /** Footer bas (ex: avatar Clerk pastille 60pt). */
  footer?: React.ReactNode;
};

/**
 * Sidebar latérale jaune V1 — pill shape (border-radius 50px).
 *
 * - Fermée (100pt) : pastilles 60pt seules (icône au centre), labels coupés
 *   par `overflow-hidden`. État par défaut sur toutes les pages sauf Dashboard.
 * - Ouverte (200pt) : pastille 60pt à gauche + label CAPS à droite. Déclenchée
 *   par hover (absolute, z-40, ne pousse pas le contenu) OU `expandedByDefault`
 *   (relative, dans le flow — Dashboard uniquement).
 *
 * Transitions : 300ms ease-in-out sur width, 200ms sur opacity du label.
 */
export function Sidebar({ items, header, footer, expandedByDefault = false }: Props) {
  const pathname = usePathname() ?? '';
  const [hovered, setHovered] = React.useState(false);
  const expanded = expandedByDefault || hovered;
  // Position absolute uniquement quand l'expansion vient du hover (pour ne pas
  // pousser le contenu). En mode `expandedByDefault`, on reste relative.
  const hoverExpanded = hovered && !expandedByDefault;

  return (
    <aside
      onMouseEnter={() => {
        if (!expandedByDefault) setHovered(true);
      }}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'hidden h-full flex-col items-stretch overflow-hidden bg-[var(--jaune)] py-3 text-black md:flex',
        'rounded-[50px] transition-[width,box-shadow] duration-300 ease-in-out',
        hoverExpanded
          ? 'absolute inset-y-0 left-0 z-40 shadow-[0_12px_32px_rgba(0,0,0,0.40)]'
          : 'relative shadow-[0_6px_12px_rgba(0,0,0,0.23)]',
        expanded ? 'w-[var(--sidebar-w-expanded)]' : 'w-[var(--sidebar-w-collapsed)]',
      )}
      aria-label="Navigation principale"
      data-expanded={expanded ? 'true' : 'false'}
    >
      {header ? (
        <div className={cn('px-[20px] pb-3', expanded ? 'text-left' : 'text-center')}>{header}</div>
      ) : null}

      <nav className="flex flex-1 flex-col items-stretch gap-1 overflow-y-auto px-[20px]">
        {items.map((it) => {
          const matchKey = it.matchPrefix ?? it.href;
          const active =
            pathname === it.href ||
            pathname.startsWith(`${matchKey}/`) ||
            pathname.startsWith(matchKey);
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href as never}
              className={cn(
                'group relative flex h-[var(--sidebar-pastille)] items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40',
                // En mode collapsed : pastille centrée (pas de gap, pas de padding latéral)
                // En mode expanded : pastille à gauche + gap-3 + label
                expanded ? 'gap-3' : 'justify-center',
                active
                  ? 'bg-[#9a7b4f] text-[var(--jaune)]'
                  : 'text-[#9a7b4f] hover:bg-black/10',
              )}
              aria-current={active ? 'page' : undefined}
            >
              {/* Pastille icône 60pt — toujours rendue, container fixe pour
                  garder la position stable pendant l'expansion. */}
              <span className="relative inline-flex h-[var(--sidebar-pastille)] w-[var(--sidebar-pastille)] shrink-0 items-center justify-center">
                <Icon size={24} className="shrink-0" aria-hidden />
                {it.badge != null && it.badge > 0 ? (
                  <span
                    className={cn(
                      'absolute right-1 top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none ring-2 ring-[var(--jaune)]',
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

              {/* Label CAPS — opacity contrôlée pour transition douce.
                  En collapsed, `overflow-hidden` sur la sidebar coupe le label. */}
              <span
                className={cn(
                  'whitespace-nowrap text-sm font-bold uppercase tracking-[0.05em] transition-opacity duration-200',
                  expanded ? 'opacity-100' : 'opacity-0',
                )}
                aria-hidden={!expanded}
              >
                {it.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {footer ? (
        <div className={cn('mt-auto px-[20px] pt-2', expanded ? 'text-left' : 'text-center')}>
          {footer}
        </div>
      ) : null}
    </aside>
  );
}
