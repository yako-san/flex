import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BikeIcon, UsersIcon } from '@/components/icons';
import { Sidebar, type SidebarItem } from './sidebar';

// next/navigation usePathname est utilisé par Sidebar pour marquer l'item actif.
let mockedPathname = '/fr-CA/admin/clients';
vi.mock('next/navigation', () => ({
  usePathname: () => mockedPathname,
}));

afterEach(() => {
  cleanup();
  mockedPathname = '/fr-CA/admin/clients';
});

const ITEMS: SidebarItem[] = [
  { href: '/fr-CA/admin', icon: BikeIcon, label: 'Dashboard' },
  {
    href: '/fr-CA/admin/clients',
    matchPrefix: '/fr-CA/admin/clients',
    icon: UsersIcon,
    label: 'Clients',
    separatorBefore: true,
  },
];

describe('Sidebar (refonte design-system 2026-05-19)', () => {
  it('rend <aside> avec aria-label "Navigation principale"', () => {
    render(<Sidebar items={ITEMS} popoverItems={[]} />);
    expect(screen.getByLabelText('Navigation principale')).toBeTruthy();
  });

  it('rend un lien <a> par item (popover désactivé)', () => {
    render(<Sidebar items={ITEMS} popoverItems={[]} />);
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it('le label de chaque item est rendu en permanence (layout vertical)', () => {
    render(<Sidebar items={ITEMS} popoverItems={[]} />);
    expect(screen.getByText('Dashboard')).toBeTruthy();
    expect(screen.getByText('Clients')).toBeTruthy();
  });

  it("aria-current='page' sur l'item dont matchPrefix correspond", () => {
    mockedPathname = '/fr-CA/admin/clients';
    render(<Sidebar items={ITEMS} popoverItems={[]} />);
    const links = screen.getAllByRole('link');
    expect(links[1]!.getAttribute('aria-current')).toBe('page');
    // Dashboard a startsWith '/fr-CA/admin' qui matche aussi '/fr-CA/admin/clients'.
    expect(links[0]!.getAttribute('aria-current')).toBe('page');
  });

  it("aria-current='page' avec sous-route (ex /admin/clients/abc)", () => {
    mockedPathname = '/fr-CA/admin/clients/cli_123';
    render(<Sidebar items={ITEMS} popoverItems={[]} />);
    expect(screen.getAllByRole('link')[1]!.getAttribute('aria-current')).toBe('page');
  });

  it('data-expanded="false" par défaut (collapsed)', () => {
    const { container } = render(<Sidebar items={ITEMS} popoverItems={[]} />);
    const wrapper = container.querySelector('[data-expanded]') as HTMLElement;
    expect(wrapper.getAttribute('data-expanded')).toBe('false');
  });

  it('expandedByDefault=true → data-expanded="true" (pattern Dashboard V1)', () => {
    const { container } = render(
      <Sidebar items={ITEMS} popoverItems={[]} expandedByDefault />,
    );
    const wrapper = container.querySelector('[data-expanded]') as HTMLElement;
    expect(wrapper.getAttribute('data-expanded')).toBe('true');
  });

  it('hover sur le conteneur → data-expanded passe à true (overlay)', () => {
    const { container } = render(<Sidebar items={ITEMS} popoverItems={[]} />);
    const wrapper = container.querySelector('[data-expanded]') as HTMLElement;
    fireEvent.mouseEnter(wrapper);
    expect(wrapper.getAttribute('data-expanded')).toBe('true');
    fireEvent.mouseLeave(wrapper);
    expect(wrapper.getAttribute('data-expanded')).toBe('false');
  });

  it('badge.variant jaune (default) → bg-black text-jaune', () => {
    const items: SidebarItem[] = [{ ...ITEMS[0]!, badge: 5 }];
    render(<Sidebar items={items} popoverItems={[]} />);
    const badge = screen.getByLabelText('5 Dashboard');
    expect(badge.className).toContain('bg-black');
    expect(badge.className).toContain('text-[var(--jaune)]');
  });

  it('badge.variant vert → bg --st-on-bench-bg', () => {
    const items: SidebarItem[] = [{ ...ITEMS[0]!, badge: 3, badgeVariant: 'vert' }];
    render(<Sidebar items={items} popoverItems={[]} />);
    expect(screen.getByLabelText('3 Dashboard').className).toContain(
      'bg-[var(--st-on-bench-bg)]',
    );
  });

  it('badge.variant rouge → bg --rouge text-white', () => {
    const items: SidebarItem[] = [{ ...ITEMS[0]!, badge: 2, badgeVariant: 'rouge' }];
    render(<Sidebar items={items} popoverItems={[]} />);
    const cls = screen.getByLabelText('2 Dashboard').className;
    expect(cls).toContain('bg-[var(--rouge)]');
    expect(cls).toContain('text-white');
  });

  it("badge >= 100 affiché '99+'", () => {
    const items: SidebarItem[] = [{ ...ITEMS[0]!, badge: 234 }];
    render(<Sidebar items={items} popoverItems={[]} />);
    expect(screen.getByText('99+')).toBeTruthy();
  });

  it('badge = 0 → pas de badge', () => {
    const items: SidebarItem[] = [{ ...ITEMS[0]!, badge: 0 }];
    render(<Sidebar items={items} popoverItems={[]} />);
    expect(screen.queryByLabelText('0 Dashboard')).toBeNull();
  });

  it('badge null → pas de badge', () => {
    const items: SidebarItem[] = [{ ...ITEMS[0]!, badge: null }];
    render(<Sidebar items={items} popoverItems={[]} />);
    expect(screen.queryByLabelText(/\d+ Dashboard/)).toBeNull();
  });

  it('séparateur <hr> rendu si separatorBefore=true', () => {
    const { container } = render(<Sidebar items={ITEMS} popoverItems={[]} />);
    // ITEMS[1] a separatorBefore: true → 1 séparateur attendu.
    expect(container.querySelectorAll('hr')).toHaveLength(1);
  });

  it('pas de séparateur sans separatorBefore', () => {
    const items: SidebarItem[] = [
      { href: '/a', icon: BikeIcon, label: 'A' },
      { href: '/b', icon: UsersIcon, label: 'B' },
    ];
    const { container } = render(<Sidebar items={items} popoverItems={[]} />);
    expect(container.querySelectorAll('hr')).toHaveLength(0);
  });

  it('popover désactivé si popoverItems vide', () => {
    render(<Sidebar items={ITEMS} popoverItems={[]} />);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('popover par défaut rendu mais caché (5 items V1)', () => {
    render(<Sidebar items={ITEMS} />);
    const menu = screen.getByRole('menu', { hidden: true });
    expect(menu).toBeTruthy();
    // 5 items : Dashboard / Archives / Dépenses / Paramètres / Aide.
    expect(menu.querySelectorAll('a').length).toBe(5);
  });

  it('versionLabel rendu uniquement en mode expand', () => {
    render(
      <Sidebar
        items={ITEMS}
        popoverItems={[]}
        versionLabel="v2.0"
        expandedByDefault
      />,
    );
    expect(screen.getByText('v2.0')).toBeTruthy();
  });

  it('loginInitial → pastille Google rendue (avec dot online)', () => {
    render(
      <Sidebar items={ITEMS} popoverItems={[]} loginInitial="y" loginTitle="yako@x" />,
    );
    expect(screen.getByTitle('yako@x').textContent).toContain('y');
  });

  it('footer custom override pastille Google', () => {
    render(
      <Sidebar
        items={ITEMS}
        popoverItems={[]}
        loginInitial="y"
        loginTitle="yako@x"
        footer={<div data-testid="userbtn">U</div>}
      />,
    );
    expect(screen.getByTestId('userbtn')).toBeTruthy();
    // La pastille Google (avec title=loginTitle) n'est PAS rendue.
    expect(screen.queryByTitle('yako@x')).toBeNull();
  });
});
