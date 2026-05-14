import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Bike, Users } from 'lucide-react';
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
  { href: '/fr-CA/admin', icon: Bike, label: 'Dashboard' },
  {
    href: '/fr-CA/admin/clients',
    matchPrefix: '/fr-CA/admin/clients',
    icon: Users,
    label: 'Clients',
  },
];

describe('Sidebar', () => {
  it('rend <aside> avec aria-label "Navigation principale"', () => {
    render(<Sidebar items={ITEMS} />);
    expect(screen.getByLabelText('Navigation principale')).toBeTruthy();
  });

  it('rend un lien <a> par item', () => {
    render(<Sidebar items={ITEMS} />);
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it('le label de chaque item est rendu (hidden via opacity-0 si collapsed)', () => {
    render(<Sidebar items={ITEMS} />);
    expect(screen.getByText('Dashboard')).toBeTruthy();
    expect(screen.getByText('Clients')).toBeTruthy();
  });

  it("aria-current='page' sur l'item dont matchPrefix correspond", () => {
    mockedPathname = '/fr-CA/admin/clients';
    render(<Sidebar items={ITEMS} />);
    const links = screen.getAllByRole('link');
    expect(links[1]!.getAttribute('aria-current')).toBe('page');
    // Note : l'item Dashboard sera AUSSI actif si son matchPrefix est un
    // préfixe (cas du layout admin réel) — comportement startsWith de la
    // logique active. Ici Dashboard n'a pas de matchPrefix donc utilise
    // href, et '/fr-CA/admin/clients' commence bien par '/fr-CA/admin/'
    // — comportement attendu côté composant (sous-route considérée
    // active).
    expect(links[0]!.getAttribute('aria-current')).toBe('page');
  });

  it("aria-current='page' avec sous-route (ex /admin/clients/abc)", () => {
    mockedPathname = '/fr-CA/admin/clients/cli_123';
    render(<Sidebar items={ITEMS} />);
    expect(screen.getAllByRole('link')[1]!.getAttribute('aria-current')).toBe('page');
  });

  it("expandedByDefault=true → w-[var(--sidebar-w-expanded)]", () => {
    render(<Sidebar items={ITEMS} expandedByDefault />);
    const aside = screen.getByLabelText('Navigation principale');
    expect(aside.className).toContain('w-[var(--sidebar-w-expanded)]');
    expect(aside.getAttribute('data-expanded')).toBe('true');
  });

  it('expandedByDefault=false → w-[var(--sidebar-w-collapsed)]', () => {
    render(<Sidebar items={ITEMS} />);
    const aside = screen.getByLabelText('Navigation principale');
    expect(aside.className).toContain('w-[var(--sidebar-w-collapsed)]');
    expect(aside.getAttribute('data-expanded')).toBe('false');
  });

  it('hover sur aside → data-expanded passe à true', () => {
    render(<Sidebar items={ITEMS} />);
    const aside = screen.getByLabelText('Navigation principale');
    fireEvent.mouseEnter(aside);
    expect(aside.getAttribute('data-expanded')).toBe('true');
    fireEvent.mouseLeave(aside);
    expect(aside.getAttribute('data-expanded')).toBe('false');
  });

  it('header slot rendu', () => {
    render(<Sidebar items={ITEMS} header={<div data-testid="logo">F</div>} />);
    expect(screen.getByTestId('logo')).toBeTruthy();
  });

  it('footer slot rendu', () => {
    render(<Sidebar items={ITEMS} footer={<div data-testid="userbtn">U</div>} />);
    expect(screen.getByTestId('userbtn')).toBeTruthy();
  });

  it('badge.variant jaune (default) → bg-black text-jaune', () => {
    const items: SidebarItem[] = [
      { ...ITEMS[0]!, badge: 5 },
    ];
    render(<Sidebar items={items} />);
    const badge = screen.getByLabelText('5 Dashboard');
    expect(badge.className).toContain('bg-black');
    expect(badge.className).toContain('text-[var(--jaune)]');
  });

  it('badge.variant vert → bg --st-on-bench-bg', () => {
    const items: SidebarItem[] = [
      { ...ITEMS[0]!, badge: 3, badgeVariant: 'vert' },
    ];
    render(<Sidebar items={items} />);
    expect(screen.getByLabelText('3 Dashboard').className).toContain(
      'bg-[var(--st-on-bench-bg)]',
    );
  });

  it('badge.variant rouge → bg --rouge text-white', () => {
    const items: SidebarItem[] = [
      { ...ITEMS[0]!, badge: 2, badgeVariant: 'rouge' },
    ];
    render(<Sidebar items={items} />);
    const cls = screen.getByLabelText('2 Dashboard').className;
    expect(cls).toContain('bg-[var(--rouge)]');
    expect(cls).toContain('text-white');
  });

  it("badge >= 100 affiché '99+'", () => {
    const items: SidebarItem[] = [
      { ...ITEMS[0]!, badge: 234 },
    ];
    render(<Sidebar items={items} />);
    expect(screen.getByText('99+')).toBeTruthy();
  });

  it('badge = 0 → pas de badge affiché', () => {
    const items: SidebarItem[] = [
      { ...ITEMS[0]!, badge: 0 },
    ];
    render(<Sidebar items={items} />);
    expect(screen.queryByLabelText('0 Dashboard')).toBeNull();
  });

  it('badge null → pas de badge', () => {
    const items: SidebarItem[] = [{ ...ITEMS[0]!, badge: null }];
    render(<Sidebar items={items} />);
    // Aucun aria-label avec un nombre devant Dashboard
    expect(screen.queryByLabelText(/\d+ Dashboard/)).toBeNull();
  });

  it("fixed left-0 z-40 hidden md:flex (sidebar desktop seulement)", () => {
    render(<Sidebar items={ITEMS} />);
    const aside = screen.getByLabelText('Navigation principale');
    const cls = aside.className;
    expect(cls).toContain('fixed');
    expect(cls).toContain('left-0');
    expect(cls).toContain('hidden');
    expect(cls).toContain('md:flex');
  });

  it("title attribute sur lien si sidebar collapsed (tooltip)", () => {
    render(<Sidebar items={ITEMS} />);
    expect(screen.getAllByRole('link')[0]!.getAttribute('title')).toBe('Dashboard');
  });

  it("pas de title si sidebar expanded (label visible)", () => {
    render(<Sidebar items={ITEMS} expandedByDefault />);
    expect(screen.getAllByRole('link')[0]!.getAttribute('title')).toBeNull();
  });
});
