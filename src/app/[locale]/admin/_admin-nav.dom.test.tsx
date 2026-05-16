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
  it("rend exactement 5 entrées primaires V1 (Inventaire/Ventes/Services/Pièces/Clients)", () => {
    render(<AdminSidebar locale="fr-CA" />);
    // V1 capture 0b-menu.png : 5 items dans la sidebar fermée. Le reste
    // (Dashboard, Archives, Paramètres, Aide, Outils) est dans le popover
    // déclenché au survol du logo FLEX REV.
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(5);
  });

  it("lien Inventaire présent", () => {
    render(<AdminSidebar locale="fr-CA" />);
    expect(screen.getByText('Inventaire')).toBeTruthy();
  });

  it("lien Clients présent", () => {
    render(<AdminSidebar locale="fr-CA" />);
    expect(screen.getByText('Clients')).toBeTruthy();
  });

  it("logo FLEX REV présent comme déclencheur du popover secondaire", () => {
    render(<AdminSidebar locale="fr-CA" />);
    // Le bouton porte un aria-label explicite pour l'a11y.
    expect(screen.getByLabelText('Menu Paramètres et Outils')).toBeTruthy();
  });
});
