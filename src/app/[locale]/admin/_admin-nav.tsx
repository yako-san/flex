'use client';

import * as React from 'react';
import Link from 'next/link';
import { OrganizationSwitcher, UserButton } from '@clerk/nextjs';
import {
  Archive,
  Database,
  Hammer,
  HelpCircle,
  Layers,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Sparkles,
  Upload,
  Users,
  Wrench,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sidebar, type SidebarItem } from '@/components/ui/sidebar';
import { SidebarMobileDrawer } from '@/components/ui/sidebar-mobile-drawer';

// Le menu V1 (capture 0b-menu.png) montre :
//   - 1 logo « FLEX REV » au sommet, cliquable
//   - 5 entrées principales seulement : INVENTAIRE / VENTES / SERVICES /
//     PIÈCES / CLIENTS
//   - Un popover déroulant au survol du logo qui expose le reste
//     (Dashboard / Archives / Paramètres / Aide / Autres)
//
// V2 historique avait 17 items plats dans la sidebar — refonte ici pour
// matcher V1. Le popover utilise Radix Popover (déjà installé) avec
// déclencheur au click ET au hover via openDelay 100ms.

type SidebarBadges = {
  inventaire: number;
  ventes: number;
  pieces: number;
};

function buildPrimary(locale: string, badges?: SidebarBadges): SidebarItem[] {
  // 5 entrées V1, dans l'ordre exact de la capture (Inventaire en tête).
  // V1 (capture 00c-menu-ouvert-v1.png) montre des badges numériques sur
  // INVENTAIRE (vert = BDT actifs), VENTES (rouge = à facturer) et
  // PIÈCES (rouge = stock épuisé). Les compteurs viennent du layout.
  return [
    {
      href: `/${locale}/admin/bdcs`,
      matchPrefix: `/${locale}/admin/inventaire`,
      icon: Wrench,
      label: 'Inventaire',
      badge: badges?.inventaire ?? null,
      badgeVariant: 'vert',
    },
    {
      href: `/${locale}/admin/ventes`,
      matchPrefix: `/${locale}/admin/ventes`,
      icon: ShoppingCart,
      label: 'Ventes',
      badge: badges?.ventes ?? null,
      badgeVariant: 'rouge',
    },
    {
      href: `/${locale}/admin/services`,
      matchPrefix: `/${locale}/admin/services`,
      icon: Layers,
      label: 'Services',
    },
    {
      href: `/${locale}/admin/pieces`,
      matchPrefix: `/${locale}/admin/pieces`,
      icon: Package,
      label: 'Pièces',
      badge: badges?.pieces ?? null,
      badgeVariant: 'rouge',
    },
    {
      href: `/${locale}/admin/clients`,
      matchPrefix: `/${locale}/admin/clients`,
      icon: Users,
      label: 'Clients',
    },
  ];
}

// Items du popover « FLEX REV » au survol du logo. Groupés par section
// comme V1 (Dashboard / Archives / Paramètres / Aide / Autres).
type SecondaryGroup = {
  label: string;
  items: { href: string; label: string; icon: React.ElementType }[];
};

function buildSecondary(locale: string): SecondaryGroup[] {
  // V1 popover (capture 00d-menu-modal-v1.png) montre seulement 5 items
  // simples : Dashboard / Archives / Dépenses / Paramètres / Aide. Pas de
  // sous-arbre Équipe/Marques/Forfaits/Vélos/Commandes — ces sous-sections
  // sont accessibles depuis /admin/settings (page hub) où les 9 cartes
  // pointent vers chaque sous-section. Garde le popover compact.
  return [
    {
      label: 'Navigation',
      items: [
        { href: `/${locale}/admin`,                label: 'Dashboard',    icon: LayoutDashboard },
        { href: `/${locale}/admin/bdcs?archive=1`, label: 'Archives',     icon: Archive },
        { href: `/${locale}/admin/bdcs?refuse=1`,  label: 'BDT refusés',  icon: Archive },
        { href: `/${locale}/admin/settings`,       label: 'Paramètres',   icon: Settings },
        { href: `/${locale}/admin/aide`,           label: 'Aide',         icon: HelpCircle },
      ],
    },
    {
      label: 'Outils dev & ops',
      items: [
        { href: `/${locale}/admin/import`,          label: 'Import v1',    icon: Upload },
        { href: `/${locale}/admin/legacy-v1`,       label: 'Dump v1',      icon: Database },
        { href: `/${locale}/admin/maintenance`,     label: 'Maintenance',  icon: Hammer },
        { href: `/${locale}/admin/settings/ui-kit`, label: 'UI Kit',       icon: Sparkles },
      ],
    },
  ];
}

/**
 * Logo Flex V1 — SVG rond complet `logo-FLEX:-jaune:brun-rond-yako.cyclo.svg`.
 * C'est un cercle brun avec « FLEX:/REV » + « yako.cyclo / Montréal, Qc »
 * en jaune. Sert de déclencheur pour le popover secondaire.
 *
 * Asset source : `public/logo/flex-rond-yako.svg` — variante 1-tenant
 * yako-cyclo. Quand le multi-tenant exposera un `Workshop.logoUrl`, on
 * substituera cet asset par celui du workshop courant.
 */
function FlexLogo({ expanded }: { expanded: boolean }) {
  const size = expanded ? 44 : 40;
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/logo/flex-rond-yako.svg"
      alt="Flex"
      width={size}
      height={size}
      aria-hidden
      style={{
        display: 'block',
        // L'asset est déjà un cercle complet — pas besoin de wrapper.
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        borderRadius: '50%',
      }}
    />
  );
}

/** Section du popover : liste verticale d'entrées avec icône + label. */
function SecondarySection({ group, onNavigate }: { group: SecondaryGroup; onNavigate: () => void }) {
  return (
    <div>
      <h3 className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-secondary-60)]">
        {group.label}
      </h3>
      <ul className="space-y-0.5">
        {group.items.map((it) => {
          const Icon = it.icon;
          return (
            <li key={it.href}>
              <Link
                href={it.href as never}
                onClick={onNavigate}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-[var(--dark)] hover:bg-[var(--gris-fond)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--jaune)]"
              >
                <Icon size={14} className="shrink-0 text-[var(--text-secondary-60)]" aria-hidden />
                <span>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Sidebar desktop (≥ md). */
export function AdminSidebar({ locale, badges }: { locale: string; badges?: SidebarBadges }) {
  const navItems = buildPrimary(locale, badges);
  const secondary = buildSecondary(locale);
  const [open, setOpen] = React.useState(false);

  return (
    <Sidebar
      items={navItems}
      header={
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Menu Paramètres et Outils"
              className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40"
              onMouseEnter={() => setOpen(true)}
            >
              <FlexLogo expanded={false} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="right"
            align="start"
            sideOffset={12}
            onMouseLeave={() => setOpen(false)}
            className="w-[240px] space-y-3 rounded-2xl bg-white p-3 shadow-2xl ring-1 ring-black/10"
          >
            {secondary.map((g) => (
              <SecondarySection key={g.label} group={g} onNavigate={() => setOpen(false)} />
            ))}
          </PopoverContent>
        </Popover>
      }
      footer={
        <div className="flex items-center justify-center pb-2">
          <UserButton
            appearance={{
              elements: { rootBox: { display: 'flex', justifyContent: 'center' } },
            }}
          />
        </div>
      }
    />
  );
}

/** Barre top mobile (< md) avec hamburger + logo + UserButton. */
export function AdminMobileTopBar({ locale, badges }: { locale: string; badges?: SidebarBadges }) {
  // Sur mobile, on garde tous les items à plat dans le drawer (pas de popover).
  // L'utilisateur scrolle plutôt que de naviguer à 2 niveaux.
  const primary = buildPrimary(locale, badges);
  const secondary = buildSecondary(locale).flatMap((g) =>
    g.items.map((it) => ({
      href: it.href,
      matchPrefix: it.href,
      icon: it.icon as SidebarItem['icon'],
      label: it.label,
    })),
  );
  const navItems: SidebarItem[] = [...primary, ...secondary];
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between gap-2 bg-[var(--jaune)] px-3 py-2 md:hidden"
      style={{ borderRadius: '50px', margin: '12px', boxShadow: '0 6px 12px rgba(0,0,0,0.23)' }}
      aria-label="Barre mobile"
    >
      <div className="flex items-center gap-2">
        <SidebarMobileDrawer
          items={navItems}
          header={<FlexLogo expanded={true} />}
          footer={
            <div className="flex items-center justify-center py-2">
              <UserButton />
            </div>
          }
        />
        <FlexLogo expanded={true} />
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
