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

describe('Sidebar (layout vertical V1)', () => {
  it('rend <aside> avec aria-label "Navigation principale"', () => {
    render(<Sidebar items={ITEMS} />);
    expect(screen.getByLabelText('Navigation principale')).toBeTruthy();
  });

  it('rend un lien <a> par item', () => {
    render(<Sidebar items={ITEMS} />);
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it('le label de chaque item est rendu (visible en permanence en V1 vertical)', () => {
    render(<Sidebar items={ITEMS} />);
    expect(screen.getByText('Dashboard')).toBeTruthy();
    expect(screen.getByText('Clients')).toBeTruthy();
  });

  it("aria-current='page' sur l'item dont matchPrefix correspond", () => {
    mockedPathname = '/fr-CA/admin/clients';
    render(<Sidebar items={ITEMS} />);
    const links = screen.getAllByRole('link');
    expect(links[1]!.getAttribute('aria-current')).toBe('page');
    // Dashboard a startsWith '/fr-CA/admin' qui matche aussi '/fr-CA/admin/clients'
    expect(links[0]!.getAttribute('aria-current')).toBe('page');
  });

  it("aria-current='page' avec sous-route (ex /admin/clients/abc)", () => {
    mockedPathname = '/fr-CA/admin/clients/cli_123';
    render(<Sidebar items={ITEMS} />);
    expect(screen.getAllByRole('link')[1]!.getAttribute('aria-current')).toBe('page');
  });

  it('largeur 100px par défaut (collapsed)', () => {
    render(<Sidebar items={ITEMS} />);
    const aside = screen.getByLabelText('Navigation principale');
    expect(aside.className).toContain('w-[var(--sidebar-w-collapsed)]');
    expect(aside.getAttribute('data-expanded')).toBe('false');
  });

  it('expandedByDefault=true → 200px expanded (pattern Dashboard V1)', () => {
    render(<Sidebar items={ITEMS} expandedByDefault />);
    const aside = screen.getByLabelText('Navigation principale');
    expect(aside.className).toContain('w-[var(--sidebar-w-expanded)]');
    expect(aside.getAttribute('data-expanded')).toBe('true');
  });

  it('hover sur aside → data-expanded passe à true (overlay 200px)', () => {
    render(<Sidebar items={ITEMS} />);
    const aside = screen.getByLabelText('Navigation principale');
    fireEvent.mouseEnter(aside);
    expect(aside.getAttribute('data-expanded')).toBe('true');
    expect(aside.className).toContain('absolute');
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
    const items: SidebarItem[] = [{ ...ITEMS[0]!, badge: 5 }];
    render(<Sidebar items={items} />);
    const badge = screen.getByLabelText('5 Dashboard');
    expect(badge.className).toContain('bg-black');
    expect(badge.className).toContain('text-[var(--jaune)]');
  });

  it('badge.variant vert → bg --st-on-bench-bg', () => {
    const items: SidebarItem[] = [{ ...ITEMS[0]!, badge: 3, badgeVariant: 'vert' }];
    render(<Sidebar items={items} />);
    expect(screen.getByLabelText('3 Dashboard').className).toContain(
      'bg-[var(--st-on-bench-bg)]',
    );
  });

  it('badge.variant rouge → bg --rouge text-white', () => {
    const items: SidebarItem[] = [{ ...ITEMS[0]!, badge: 2, badgeVariant: 'rouge' }];
    render(<Sidebar items={items} />);
    const cls = screen.getByLabelText('2 Dashboard').className;
    expect(cls).toContain('bg-[var(--rouge)]');
    expect(cls).toContain('text-white');
  });

  it("badge >= 100 affiché '99+'", () => {
    const items: SidebarItem[] = [{ ...ITEMS[0]!, badge: 234 }];
    render(<Sidebar items={items} />);
    expect(screen.getByText('99+')).toBeTruthy();
  });

  it('badge = 0 → pas de badge affiché', () => {
    const items: SidebarItem[] = [{ ...ITEMS[0]!, badge: 0 }];
    render(<Sidebar items={items} />);
    expect(screen.queryByLabelText('0 Dashboard')).toBeNull();
  });

  it('badge null → pas de badge', () => {
    const items: SidebarItem[] = [{ ...ITEMS[0]!, badge: null }];
    render(<Sidebar items={items} />);
    expect(screen.queryByLabelText(/\d+ Dashboard/)).toBeNull();
  });

  it('hidden md:flex rounded-[50px] (sidebar desktop pill V1)', () => {
    render(<Sidebar items={ITEMS} />);
    const aside = screen.getByLabelText('Navigation principale');
    const cls = aside.className;
    expect(cls).toContain('hidden');
    expect(cls).toContain('md:flex');
    expect(cls).toContain('rounded-[50px]');
  });

  it('séparateurs <hr> entre items (V1 visual)', () => {
    const { container } = render(<Sidebar items={ITEMS} />);
    // 2 items → 1 séparateur entre eux
    expect(container.querySelectorAll('hr')).toHaveLength(1);
  });

  it('badge en overlay sur l\'icône (top-right, pas en ligne)', () => {
    const items: SidebarItem[] = [{ ...ITEMS[0]!, badge: 7, badgeVariant: 'vert' }];
    render(<Sidebar items={items} />);
    const badge = screen.getByLabelText('7 Dashboard');
    // Position absolute pour overlay
    expect(badge.className).toContain('absolute');
  });
});
