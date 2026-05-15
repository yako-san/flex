import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('./refresh-actions', () => ({
  refreshFromDumpAction: vi.fn().mockResolvedValue(null),
}));

import { RefreshForm } from './refresh-form';

describe('RefreshForm', () => {
  it("titre 'Refresh partiel (workshop existant)'", () => {
    render(<RefreshForm />);
    expect(screen.getByText(/Refresh partiel/)).toBeTruthy();
  });

  it("input file required type=file accept JSON", () => {
    const { container } = render(<RefreshForm />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.required).toBe(true);
    expect(input.name).toBe('dump');
    expect(input.getAttribute('accept')).toContain('json');
  });

  it("bouton submit 'Hydrater les nouveaux champs'", () => {
    render(<RefreshForm />);
    const btn = screen.getByRole('button', { name: /Hydrater/ });
    expect(btn.getAttribute('type')).toBe('submit');
  });

  it("au mount, pas d'erreur ni success", () => {
    render(<RefreshForm />);
    expect(screen.queryByText('✓ Refresh terminé')).toBeNull();
  });

  it("description mentionne 'sans toucher aux clients/vélos/BDT'", () => {
    render(<RefreshForm />);
    expect(screen.getByText(/sans toucher aux/)).toBeTruthy();
  });
});
