import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Bike, Users } from 'lucide-react';
import { SidebarMobileDrawer } from './sidebar-mobile-drawer';
import type { SidebarItem } from './sidebar';

let mockedPathname = '/fr-CA/admin';
vi.mock('next/navigation', () => ({
  usePathname: () => mockedPathname,
}));

afterEach(() => {
  cleanup();
  mockedPathname = '/fr-CA/admin';
  // Reset body overflow (le drawer locke pendant ouverture)
  document.body.style.overflow = '';
});

const ITEMS: SidebarItem[] = [
  { href: '/fr-CA/admin', icon: Bike, label: 'Dashboard' },
  { href: '/fr-CA/admin/clients', icon: Users, label: 'Clients' },
];

describe('SidebarMobileDrawer', () => {
  it('rend un bouton hamburger trigger', () => {
    render(<SidebarMobileDrawer items={ITEMS} />);
    expect(screen.getByRole('button', { name: 'Menu' })).toBeTruthy();
  });

  it("trigger triggerLabel custom", () => {
    render(<SidebarMobileDrawer items={ITEMS} triggerLabel="Nav" />);
    expect(screen.getByRole('button', { name: 'Nav' })).toBeTruthy();
  });

  it("aria-expanded='false' au montage (drawer fermé)", () => {
    render(<SidebarMobileDrawer items={ITEMS} />);
    expect(screen.getByRole('button', { name: 'Menu' }).getAttribute('aria-expanded')).toBe(
      'false',
    );
  });

  it("clic trigger ouvre le drawer (aria-expanded='true')", () => {
    render(<SidebarMobileDrawer items={ITEMS} />);
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    expect(
      screen.getByRole('button', { name: 'Menu' }).getAttribute('aria-expanded'),
    ).toBe('true');
  });

  it('panel a role=dialog + aria-modal=true', () => {
    render(<SidebarMobileDrawer items={ITEMS} />);
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-label')).toBe('Navigation');
  });

  it("translate-x slide animation : -translate-x-full fermé, translate-x-0 ouvert", () => {
    render(<SidebarMobileDrawer items={ITEMS} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('-translate-x-full');

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    expect(dialog.className).toContain('translate-x-0');
  });

  it("ouverture lock le body scroll (overflow: hidden)", () => {
    render(<SidebarMobileDrawer items={ITEMS} />);
    expect(document.body.style.overflow).toBe('');

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    expect(document.body.style.overflow).toBe('hidden');
  });

  it("clic croix ferme le drawer", () => {
    render(<SidebarMobileDrawer items={ITEMS} />);
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    expect(
      screen.getByRole('button', { name: 'Menu' }).getAttribute('aria-expanded'),
    ).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'Fermer le menu' }));
    expect(
      screen.getByRole('button', { name: 'Menu' }).getAttribute('aria-expanded'),
    ).toBe('false');
  });

  it('Escape ferme le drawer', () => {
    render(<SidebarMobileDrawer items={ITEMS} />);
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(
      screen.getByRole('button', { name: 'Menu' }).getAttribute('aria-expanded'),
    ).toBe('false');
  });

  it("clic un lien ferme le drawer (auto-close on navigate)", () => {
    render(<SidebarMobileDrawer items={ITEMS} />);
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    fireEvent.click(screen.getByText('Clients'));
    expect(
      screen.getByRole('button', { name: 'Menu' }).getAttribute('aria-expanded'),
    ).toBe('false');
  });

  it('rend tous les items en liens', () => {
    render(<SidebarMobileDrawer items={ITEMS} />);
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it("aria-current='page' sur l'item actif", () => {
    mockedPathname = '/fr-CA/admin/clients';
    render(<SidebarMobileDrawer items={ITEMS} />);
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    const link = screen.getByText('Clients').closest('a');
    expect(link?.getAttribute('aria-current')).toBe('page');
  });

  it('badge affiché si > 0', () => {
    render(
      <SidebarMobileDrawer
        items={[
          { href: '/x', icon: Bike, label: 'BDT', badge: 5, badgeVariant: 'rouge' },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    expect(screen.getByLabelText('5 BDT')).toBeTruthy();
  });

  it('header slot rendu', () => {
    render(
      <SidebarMobileDrawer
        items={ITEMS}
        header={<div data-testid="brand">F Flex</div>}
      />,
    );
    expect(screen.getByTestId('brand')).toBeTruthy();
  });

  it('footer slot rendu', () => {
    render(
      <SidebarMobileDrawer items={ITEMS} footer={<div data-testid="foot">U</div>} />,
    );
    expect(screen.getByTestId('foot')).toBeTruthy();
  });

  it('hamburger trigger visible md:hidden seulement', () => {
    render(<SidebarMobileDrawer items={ITEMS} />);
    expect(screen.getByRole('button', { name: 'Menu' }).className).toContain('md:hidden');
  });
});
