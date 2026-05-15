import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('next/navigation', () => ({
  usePathname: () => '/fr-CA/admin',
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@clerk/nextjs', () => ({
  UserButton: () => null,
  OrganizationSwitcher: () => null,
}));

import { AdminWorkshopBar, AdminSidebar } from './_admin-nav';

describe('AdminWorkshopBar', () => {
  it("workshopName renseigné → 'Workshop : yako-cyclo'", () => {
    render(<AdminWorkshopBar workshopName="yako-cyclo" />);
    expect(screen.getByText(/Workshop : yako-cyclo/)).toBeTruthy();
  });

  it("workshopName null → 'Aucun workshop lié'", () => {
    render(<AdminWorkshopBar workshopName={null} />);
    expect(screen.getByText('Aucun workshop lié')).toBeTruthy();
  });
});

describe('AdminSidebar', () => {
  it("rend des liens de navigation admin", () => {
    render(<AdminSidebar locale="fr-CA" />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(8);
  });

  it("lien Inventaire présent", () => {
    render(<AdminSidebar locale="fr-CA" />);
    expect(screen.getByText('Inventaire')).toBeTruthy();
  });

  it("lien Clients présent", () => {
    render(<AdminSidebar locale="fr-CA" />);
    expect(screen.getByText('Clients')).toBeTruthy();
  });
});
