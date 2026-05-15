import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('./actions', () => ({
  recomputeStockAction: vi.fn().mockResolvedValue(null),
}));

import { RecomputeStockButton } from './recompute-stock-button';

describe('RecomputeStockButton', () => {
  it("rend un bouton 'Recalculer' dans un form", () => {
    render(<RecomputeStockButton />);
    const btn = screen.getByRole('button', { name: /Recalculer/ });
    expect(btn).toBeTruthy();
    // Doit être un submit
    expect(btn.getAttribute('type')).toBe('submit');
  });

  it("au mount → pas de message d'erreur ni succès", () => {
    render(<RecomputeStockButton />);
    expect(screen.queryByText(/✓/)).toBeNull();
  });

  it("bouton n'est pas désactivé par défaut", () => {
    render(<RecomputeStockButton />);
    const btn = screen.getByRole('button') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it("label par défaut contient 'Recalculer stockPhysique/stockReserve'", () => {
    render(<RecomputeStockButton />);
    expect(screen.getByText(/Recalculer stockPhysique\/stockReserve/)).toBeTruthy();
  });
});
