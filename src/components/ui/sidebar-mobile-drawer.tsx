'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MenuIcon, XIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import type { SidebarItem } from './sidebar';

type Props = {
  items: SidebarItem[];
  /** Slot affiché en haut du drawer (logo, branding). */
  header?: React.ReactNode;
  /** Slot affiché en bas du drawer (UserButton, signOut). */
  footer?: React.ReactNode;
  /** Label du bouton trigger (a11y, défaut "Menu"). */
  triggerLabel?: string;
};

/**
 * Drawer hamburger pour la navigation mobile. Remplace la nav horizontale
 * scrollable (peu ergonomique sur petit écran : il fallait scroll pour voir
 * les 17 sections).
 *
 * Visible uniquement < md (la sidebar latérale prend le relais ≥ md).
 *
 * Pattern :
 * - Trigger : bouton hamburger dans la barre top mobile
 * - Backdrop noir 50% + panel slide-in depuis la gauche (220px)
 * - Close : tap backdrop, tap un item, touche Escape, croix en haut
 * - Body scroll-lock pendant l'ouverture (évite double-scroll)
 *
 * Pas de Radix Dialog ici — un simple useState + transform CSS suffit et
 * évite l'overhead Radix (le drawer est purement visuel, sans focus trap
 * complexe). aria-modal + role="dialog" pour l'a11y minimale.
 */
export function SidebarMobileDrawer({ items, header, footer, triggerLabel = 'Menu' }: Props) {
  const pathname = usePathname() ?? '';
  const [open, setOpen] = React.useState(false);
  const closeBtnRef = React.useRef<HTMLButtonElement>(null);

  // Escape ferme le drawer
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Scroll-lock body pendant l'ouverture
  React.useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Focus la croix à l'ouverture (pour navigation clavier)
  React.useEffect(() => {
    if (open) closeBtnRef.current?.focus();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 md:hidden"
        aria-label={triggerLabel}
        aria-expanded={open}
        aria-controls="sidebar-mobile-drawer"
      >
        <MenuIcon className="h-[22px] w-[22px]" aria-hidden />
      </button>

      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 md:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      {/* Panel */}
      <aside
        id="sidebar-mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen w-[220px] flex-col bg-[var(--jaune)] py-3 text-black shadow-xl transition-transform duration-200 md:hidden',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-3 pb-2">
          <div className="flex-1">{header}</div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40"
            aria-label="Fermer le menu"
          >
            <XIcon className="h-[18px] w-[18px]" aria-hidden />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2">
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
                onClick={() => setOpen(false)}
                className={cn(
                  'flex h-11 items-center gap-3 rounded-lg px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40',
                  active ? 'bg-black/15 font-bold' : 'hover:bg-black/10',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                <span className="truncate text-sm">{it.label}</span>
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

        {footer ? <div className="mt-auto border-t border-black/10 px-2 pt-2">{footer}</div> : null}
      </aside>
    </>
  );
}
