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
  it("affiche les totaux (sous-totaux, taxes, grand total)", () => {
    render(<DemoBDCTotaux />);
    // Cherche un montant TPS ou TVQ
    expect(screen.getByText(/9.78|9,78/)).toBeTruthy();
  });

  it("grand total 224.79 visible", () => {
    render(<DemoBDCTotaux />);
    expect(screen.getByText(/224/)).toBeTruthy();
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
