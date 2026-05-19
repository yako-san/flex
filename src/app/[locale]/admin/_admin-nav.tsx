'use client';

import * as React from 'react';
import { OrganizationSwitcher, UserButton } from '@clerk/nextjs';
import {
  ArchiveBoxIcon,
  Cog6ToothIcon,
  CurrencyDollarIcon,
  DashboardIcon,
  PackageIcon,
  QuestionMarkCircleIcon,
  ShoppingCartIcon,
  UsersIcon,
  WrenchIcon,
  TagIcon,
} from '@/components/icons';
import {
  Sidebar,
  type SidebarItem,
  type SidebarPopoverItem,
} from '@/components/ui/sidebar';
import { SidebarMobileDrawer } from '@/components/ui/sidebar-mobile-drawer';

type SidebarBadges = {
  inventaire: number;
  ventes: number;
  pieces: number;
};

/**
 * 5 entrées principales V1 (capture 0b-menu.png) :
 * INVENTAIRE / VENTES / SERVICES / PIÈCES / CLIENTS.
 * Badges numériques sur INVENTAIRE (vert), VENTES (rouge), PIÈCES (rouge).
 */
function buildPrimary(locale: string, badges?: SidebarBadges): SidebarItem[] {
  return [
    {
      href: `/${locale}/admin/bdcs`,
      matchPrefix: `/${locale}/admin/inventaire`,
      icon: TagIcon,
      label: 'Inventaire',
      badge: badges?.inventaire ?? null,
      badgeVariant: 'vert',
    },
    {
      href: `/${locale}/admin/ventes`,
      matchPrefix: `/${locale}/admin/ventes`,
      icon: ShoppingCartIcon,
      label: 'Ventes',
      badge: badges?.ventes ?? null,
      badgeVariant: 'rouge',
    },
    {
      href: `/${locale}/admin/services`,
      matchPrefix: `/${locale}/admin/services`,
      icon: WrenchIcon,
      label: 'Services',
      separatorBefore: true,
    },
    {
      href: `/${locale}/admin/pieces`,
      matchPrefix: `/${locale}/admin/pieces`,
      icon: PackageIcon,
      label: 'Pièces',
      badge: badges?.pieces ?? null,
      badgeVariant: 'rouge',
    },
    {
      href: `/${locale}/admin/clients`,
      matchPrefix: `/${locale}/admin/clients`,
      icon: UsersIcon,
      label: 'Clients',
      separatorBefore: true,
    },
  ];
}

/**
 * Popover logo V1 (capture 00d-menu-modal-v1.png) — 5 items simples :
 * Dashboard / Archives / Dépenses / Paramètres / Aide.
 * Les outils dev (Import v1, Maintenance, UI Kit) restent accessibles
 * via `/admin/settings` (hub 9 cartes), pas la peine de surcharger le
 * popover principal.
 */
function buildPopover(locale: string): SidebarPopoverItem[] {
  return [
    { href: `/${locale}/admin`, icon: DashboardIcon, label: 'Dashboard' },
    { href: `/${locale}/admin/bdcs?archive=1`, icon: ArchiveBoxIcon, label: 'Archives' },
    { href: `/${locale}/admin/depenses`, icon: CurrencyDollarIcon, label: 'Dépenses' },
    { href: `/${locale}/admin/settings`, icon: Cog6ToothIcon, label: 'Paramètres' },
    { href: `/${locale}/admin/aide`, icon: QuestionMarkCircleIcon, label: 'Aide' },
  ];
}

/** Sidebar desktop (≥ md). */
export function AdminSidebar({ locale, badges }: { locale: string; badges?: SidebarBadges }) {
  return (
    <Sidebar
      items={buildPrimary(locale, badges)}
      popoverItems={buildPopover(locale)}
      versionLabel={
        <>
          v2.0<br />yako
        </>
      }
      footer={
        <UserButton
          appearance={{
            elements: { rootBox: { display: 'flex', justifyContent: 'center' } },
          }}
        />
      }
    />
  );
}

/** Barre top mobile (< md) avec hamburger + logo + UserButton. */
export function AdminMobileTopBar({ locale, badges }: { locale: string; badges?: SidebarBadges }) {
  const primary = buildPrimary(locale, badges);
  const popover = buildPopover(locale);
  const navItems: SidebarItem[] = [
    ...primary,
    ...popover.map<SidebarItem>((p) => ({
      href: p.href,
      matchPrefix: p.href,
      icon: p.icon,
      label: p.label,
    })),
  ];
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between gap-2 bg-[var(--jaune)] px-3 py-2 md:hidden"
      style={{ borderRadius: 50, margin: 12, boxShadow: 'var(--shadow-sidebar)' }}
      aria-label="Barre mobile"
    >
      <div className="flex items-center gap-2">
        <SidebarMobileDrawer
          items={navItems}
          header={
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src="/logo/logo-FLEX-rond-yako.svg"
              alt="FLEX/REV"
              width={44}
              height={44}
              style={{ borderRadius: '50%', display: 'block' }}
            />
          }
          footer={
            <div className="flex items-center justify-center py-2">
              <UserButton />
            </div>
          }
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo/logo-FLEX-rond-yako.svg"
          alt="FLEX/REV"
          width={44}
          height={44}
          style={{ borderRadius: '50%', display: 'block' }}
        />
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
