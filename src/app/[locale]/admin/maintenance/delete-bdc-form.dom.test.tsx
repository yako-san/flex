import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('./actions', () => ({
  deleteBdcByIdAction: vi.fn().mockResolvedValue(null),
}));

import { DeleteBdcForm } from './delete-bdc-form';

describe('DeleteBdcForm', () => {
  it("rend les 2 inputs (bdcId, confirmation) + bouton", () => {
    render(<DeleteBdcForm />);
    expect(screen.getByPlaceholderText('bdc_...')).toBeTruthy();
    expect(screen.getByPlaceholderText('SUPPRIMER')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Supprimer le BDT/ })).toBeTruthy();
  });

  it("input bdcId est required", () => {
    render(<DeleteBdcForm />);
    const input = screen.getByPlaceholderText('bdc_...') as HTMLInputElement;
    expect(input.required).toBe(true);
    expect(input.name).toBe('bdcId');
  });

  it("input confirmation est required avec name=confirmation", () => {
    render(<DeleteBdcForm />);
    const input = screen.getByPlaceholderText('SUPPRIMER') as HTMLInputElement;
    expect(input.required).toBe(true);
    expect(input.name).toBe('confirmation');
  });

  it("au mount, pas de message d'erreur ni succès", () => {
    render(<DeleteBdcForm />);
    expect(screen.queryByText(/✓/)).toBeNull();
  });

  it("bouton type=submit, non disabled par défaut", () => {
    render(<DeleteBdcForm />);
    const btn = screen.getByRole('button', { name: /Supprimer le BDT/ });
    expect(btn.getAttribute('type')).toBe('submit');
    expect((btn as HTMLButtonElement).disabled).toBe(false);
  });

  it("label mentionne le code SUPPRIMER en majuscules", () => {
    render(<DeleteBdcForm />);
    expect(screen.getByText(/SUPPRIMER/)).toBeTruthy();
  });
});
