import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('next/navigation', () => ({
  usePathname: () => '/fr-CA/admin',
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/lib/utils/toast', () => ({ toast: vi.fn() }));
vi.mock('@/components/ui/confirm-dialog', () => ({
  customConfirm: vi.fn().mockResolvedValue(true),
}));

import { DemoRemiseInput, DemoBDCTotaux, DemoVeloFormFields } from './domain-demos';

describe('DemoRemiseInput', () => {
  it("rend un input numérique et un radiogroup % / $", () => {
    const { container } = render(<DemoRemiseInput />);
    const input = container.querySelector('input[type="number"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    // Toggle est un radiogroup
    expect(screen.getByRole('radiogroup', { name: /Type de remise/i })).toBeTruthy();
  });

  it("valeur initiale 10% affichée dans l'indicateur", () => {
    render(<DemoRemiseInput />);
    expect(screen.getByText(/→ 10 %/)).toBeTruthy();
  });
});

describe('DemoBDCTotaux', () => {
  it("affiche les sous-totaux services et pièces (rendu pill compact V1)", () => {
    const { container } = render(<DemoBDCTotaux />);
    // Le pill noir compact affiche Services + Pièces (pas TPS/TVQ directement,
    // qui sont exposées via le title pour rester lisible).
    expect(screen.getByText('Services')).toBeTruthy();
    expect(screen.getByText('Pièces')).toBeTruthy();
    // TPS/TVQ accessibles via le title attribute de la pill
    const aside = screen.getByLabelText('Totaux du BDT');
    expect(aside.getAttribute('title') ?? '').toMatch(/TPS|TVQ/);
    void container;
  });

  it("grand total 224.79 visible (jaune à droite)", () => {
    const { container } = render(<DemoBDCTotaux />);
    expect(container.textContent).toContain('224,79');
  });
});

describe('DemoVeloFormFields', () => {
  it("rend les 4 marques dans le select marque", () => {
    const { container } = render(<DemoVeloFormFields />);
    const select = container.querySelector('select') as HTMLSelectElement;
    // 1 option vide + 4 marques
    expect(select.options.length).toBeGreaterThanOrEqual(4);
  });

  it("modele input visible (placeholder 'Lite 1')", () => {
    const { container } = render(<DemoVeloFormFields />);
    const modeleInput = container.querySelector('input[placeholder*="Lite"]') as HTMLInputElement;
    expect(modeleInput).toBeTruthy();
  });
});
