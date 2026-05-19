'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { IconComponent } from '@/components/icons';
import {
  ArchiveBoxIcon,
  Cog6ToothIcon,
  CurrencyDollarIcon,
  DashboardIcon,
  QuestionMarkCircleIcon,
} from '@/components/icons';

export type SidebarItem = {
  href: string;
  /** Doit pointer vers la racine d'une route (matched par startsWith). */
  matchPrefix?: string;
  icon: IconComponent;
  label: string;
  /** Compteur affiché en pastille (ex: BDT actifs). `null|undefined` = caché. */
  badge?: number | null;
  /**
   * Couleur de la pastille. Défaut : neutre (jaune sur dark).
   * Variantes V1 : `vert` (BDT actifs), `rouge` (alertes), `jaune` (par défaut).
   */
  badgeVariant?: 'jaune' | 'vert' | 'rouge';
  /** Insérer un séparateur AU-DESSUS de cet item. */
  separatorBefore?: boolean;
};

export type SidebarPopoverItem = {
  href: string;
  icon: IconComponent;
  label: string;
};

type Props = {
  items: SidebarItem[];
  /**
   * Si true, sidebar reste expanded (200px) en permanence — pattern
   * V1 sur `/dashboard`. Sinon, collapsed (100px) avec hover-expand.
   */
  expandedByDefault?: boolean;
  /**
   * Items du popover ancré sur le logo (Dashboard / Archives / Dépenses /
   * Paramètres / Aide). Override possible. `[]` = popover désactivé.
   */
  popoverItems?: SidebarPopoverItem[];
  /** Texte sous le logo en mode expanded (ex: `v1.0.19 / yako`). */
  versionLabel?: React.ReactNode;
  /** Initiale affichée sur l'avatar Google bas de sidebar. */
  loginInitial?: string;
  /** Tooltip de l'avatar (ex: email). */
  loginTitle?: string;
  /**
   * Override du footer (priorité sur `loginInitial`). Utile pour
   * intégrer `<UserButton />` Clerk qui gère son propre menu profil.
   */
  footer?: React.ReactNode;
};

const DEFAULT_POPOVER_ITEMS: SidebarPopoverItem[] = [
  { href: '/admin', icon: DashboardIcon, label: 'Dashboard' },
  { href: '/admin/archives', icon: ArchiveBoxIcon, label: 'Archives' },
  { href: '/admin/depenses', icon: CurrencyDollarIcon, label: 'Dépenses' },
  { href: '/admin/settings', icon: Cog6ToothIcon, label: 'Paramètres' },
  { href: '/admin/aide', icon: QuestionMarkCircleIcon, label: 'Aide' },
];

const TIMING = 'cubic-bezier(0.4, 0, 0.2, 1)';

/**
 * Sidebar latérale jaune V1 — pill shape (border-radius 50px).
 *
 * Spec figée par `docs/design-system/preview/components-sidebar.html` :
 * - Collapsed = 100px / Expanded = 200px (hover ou `expandedByDefault`).
 * - Pastille = 60px ; logo 60→120 ; login 60→80 ; transition 320ms
 *   cubic-bezier(0.4, 0, 0.2, 1).
 * - Layout item = vertical (pastille au-dessus, label slot 16pt dessous)
 *   permanent. Label fade-in en expand, taille 11→13pt.
 * - Shadow ground : deux ellipses positionnées à la base de la pill
 *   (ombre douce + contact dur). S'élargissent au hover-expand.
 * - Hover sur logo → popover (Dashboard / Archives / Dépenses /
 *   Paramètres / Aide) ancré à droite, 5 items Heroicons 18px.
 *
 * Décision yako-san (cf. PR #79, SIDEBAR-SPEC) : conserve `position:
 * absolute` au hover-expand pour ne PAS pousser le contenu (overlay).
 * La preview HTML utilise `relative` mais V2 garde le pattern V1 validé.
 */
export function Sidebar({
  items,
  expandedByDefault = false,
  popoverItems = DEFAULT_POPOVER_ITEMS,
  versionLabel,
  loginInitial,
  loginTitle,
  footer,
}: Props) {
  const pathname = usePathname() ?? '';
  const [hovered, setHovered] = React.useState(false);
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const expanded = expandedByDefault || hovered;
  const overlay = hovered && !expandedByDefault;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPopoverOpen(false);
      }}
      data-expanded={expanded}
      className={cn(
        'relative hidden h-full md:flex md:flex-shrink-0',
        overlay && 'absolute inset-y-0 left-0 z-40',
      )}
    >
      {/* Shadow ground — deux ellipses à la base de la pill (cf.
          preview spacing-shadows.html). S'élargissent au hover-expand. */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 rounded-full"
        style={{
          bottom: '-3px',
          transform: 'translateX(-50%) translateY(50%)',
          width: expanded ? 300 : 150,
          height: expanded ? 7 : 5,
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0) 70%)',
          filter: expanded ? 'blur(4px)' : 'blur(3px)',
          transition: `width 320ms ${TIMING}, height 320ms ${TIMING}, filter 320ms ${TIMING}`,
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 rounded-full"
        style={{
          bottom: '-3px',
          transform: 'translateX(-50%) translateY(50%)',
          width: expanded ? 160 : 80,
          height: expanded ? 4 : 3,
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%)',
          filter: expanded ? 'blur(2.5px)' : 'blur(2px)',
          transition: `width 320ms ${TIMING}, height 320ms ${TIMING}`,
        }}
      />

      <aside
        aria-label="Navigation principale"
        className="relative z-[1] flex h-full flex-col items-stretch overflow-visible bg-[var(--jaune)] py-5 text-black"
        style={{
          width: expanded
            ? 'var(--sidebar-w-expanded)'
            : 'var(--sidebar-w-collapsed)',
          borderRadius: 'var(--radius-sidebar)',
          transition: `width 320ms ${TIMING}, box-shadow 320ms ${TIMING}`,
          boxShadow: overlay
            ? 'var(--shadow-sidebar-hover)'
            : 'var(--shadow-sidebar)',
          gap: 14,
        }}
      >
        {/* Logo + version (haut) */}
        <div className="flex flex-col items-center gap-1.5">
          <button
            type="button"
            className="relative cursor-pointer rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
            style={{
              width: expanded ? 120 : 60,
              height: expanded ? 120 : 60,
              transition: `width 320ms ${TIMING}, height 320ms ${TIMING}`,
            }}
            aria-label="FLEX/REV — yako.cyclo"
            aria-expanded={popoverOpen}
            aria-haspopup="menu"
            onMouseEnter={() => setPopoverOpen(true)}
            onFocus={() => setPopoverOpen(true)}
            onBlur={() => setPopoverOpen(false)}
          >
            <Image
              src="/logo/logo-F-brun-rond.svg"
              alt=""
              fill
              sizes="120px"
              className="rounded-full transition-opacity duration-200"
              style={{ opacity: expanded ? 0 : 1 }}
              priority
            />
            <Image
              src="/logo/logo-FLEX-rond-yako.svg"
              alt=""
              fill
              sizes="120px"
              className="rounded-full transition-opacity duration-200"
              style={{ opacity: expanded ? 1 : 0 }}
              priority
            />
          </button>
          <div
            className="overflow-hidden text-center text-[11px] font-semibold leading-tight"
            style={{
              color: 'var(--brun-text)',
              opacity: expanded ? 1 : 0,
              height: expanded ? 28 : 0,
              transition: `opacity 200ms ease 80ms, height 320ms ${TIMING}`,
            }}
            aria-hidden={!expanded}
          >
            {versionLabel}
          </div>
        </div>

        {/* Nav primaire */}
        <nav className="my-auto flex w-full flex-col items-stretch gap-1.5">
          {items.map((it) => {
            const matchKey = it.matchPrefix ?? it.href;
            const active =
              pathname === it.href ||
              pathname.startsWith(`${matchKey}/`) ||
              pathname.startsWith(matchKey);
            const Icon = it.icon;
            return (
              <React.Fragment key={it.href}>
                {it.separatorBefore ? (
                  <hr
                    aria-hidden
                    className="mx-auto my-1 border-0"
                    style={{
                      width: expanded ? '80%' : '60%',
                      borderTop: '1px solid rgba(154,123,79,0.3)',
                      transition: `width 320ms ${TIMING}`,
                    }}
                  />
                ) : null}
                <Link
                  href={it.href as never}
                  className="group flex flex-col items-center gap-1 no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40"
                  aria-current={active ? 'page' : undefined}
                  title={!expanded ? it.label : undefined}
                >
                  <span
                    className={cn(
                      'relative inline-flex shrink-0 items-center justify-center rounded-full transition-colors',
                      active
                        ? 'bg-[var(--brun-text)] text-[var(--jaune)]'
                        : 'text-[var(--brun-text)] group-hover:bg-[rgba(154,123,79,0.12)]',
                    )}
                    style={{
                      width: 'var(--sidebar-pastille)',
                      height: 'var(--sidebar-pastille)',
                    }}
                  >
                    <Icon className="h-[40px] w-[40px]" strokeWidth={1.5} aria-hidden />
                    {it.badge != null && it.badge > 0 ? (
                      <span
                        className={cn(
                          'absolute -right-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none',
                          it.badgeVariant === 'vert' &&
                            'bg-[var(--st-on-bench-bg)] text-black',
                          it.badgeVariant === 'rouge' &&
                            'bg-[var(--rouge)] text-white',
                          (!it.badgeVariant || it.badgeVariant === 'jaune') &&
                            'bg-black text-[var(--jaune)]',
                        )}
                        style={{ boxShadow: '0 0 0 2px var(--jaune)' }}
                        aria-label={`${it.badge} ${it.label}`}
                      >
                        {it.badge > 99 ? '99+' : it.badge}
                      </span>
                    ) : null}
                  </span>
                  <span
                    className="whitespace-nowrap font-bold uppercase tracking-[0.05em]"
                    style={{
                      height: 16,
                      lineHeight: '16px',
                      color: 'var(--brun-text)',
                      fontSize: expanded ? 13 : 11,
                      opacity: expanded ? 1 : 0,
                      transition: `opacity 200ms ease 80ms, font-size 320ms ${TIMING}`,
                    }}
                  >
                    {it.label}
                  </span>
                </Link>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Footer custom (Clerk UserButton) — prioritaire sur la pastille spec. */}
        {footer ? (
          <div className="flex justify-center">{footer}</div>
        ) : loginInitial !== undefined ? (
          <div className="flex justify-center">
            <div
              className="relative flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-[0_2px_6px_rgba(0,0,0,0.25)]"
              style={{
                width: expanded ? 80 : 60,
                height: expanded ? 80 : 60,
                fontSize: expanded ? 28 : 22,
                textShadow: '0 1px 2px rgba(0,0,0,0.35)',
                background:
                  'radial-gradient(circle at 35% 30%, #fbbc04 0%, #ea4335 35%, #4285f4 70%, #34a853 100%)',
                transition: `width 320ms ${TIMING}, height 320ms ${TIMING}, font-size 320ms ${TIMING}`,
              }}
              title={loginTitle}
            >
              {loginInitial}
              <span
                aria-hidden
                className="absolute right-0 bottom-0.5 rounded-full"
                style={{
                  width: 14,
                  height: 14,
                  background: 'var(--st-on-bench-bg)',
                  boxShadow: '0 0 0 2px var(--jaune)',
                }}
              />
            </div>
          </div>
        ) : null}
      </aside>

      {/* Popover logo */}
      {popoverItems.length > 0 ? (
        <div
          className="absolute z-50 flex flex-col gap-0.5 rounded-2xl bg-white p-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.18)]"
          style={{
            top: 20,
            left: `calc(100% + 16px)`,
            width: 200,
            opacity: popoverOpen ? 1 : 0,
            pointerEvents: popoverOpen ? 'auto' : 'none',
            transform: popoverOpen ? 'translateX(0)' : 'translateX(-8px)',
            transition: `opacity 180ms ease, transform 220ms ${TIMING}`,
          }}
          onMouseEnter={() => setPopoverOpen(true)}
          onMouseLeave={() => setPopoverOpen(false)}
          role="menu"
          aria-label="Menu logo"
          aria-hidden={!popoverOpen}
        >
          {popoverItems.map((p) => {
            const Icon = p.icon;
            return (
              <Link
                key={p.href}
                href={p.href as never}
                role="menuitem"
                className="flex items-center gap-3 rounded-[10px] px-3.5 py-2 text-[13px] font-medium text-[var(--dark)] no-underline transition-colors hover:bg-[var(--gris-fond)]"
              >
                <Icon
                  className="h-[18px] w-[18px] shrink-0"
                  style={{ color: 'rgba(0,0,0,0.55)' }}
                  strokeWidth={1.5}
                  aria-hidden
                />
                {p.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
