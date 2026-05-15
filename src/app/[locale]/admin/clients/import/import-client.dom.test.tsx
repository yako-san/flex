import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('./actions', () => ({
  previewClientsCsvAction: vi.fn().mockResolvedValue(null),
  executeClientsImportAction: vi.fn().mockResolvedValue(null),
}));

import { ImportClientsPage } from './import-client';

describe('ImportClientsPage', () => {
  it("titre '1. Téléverse ton fichier CSV' visible", () => {
    render(<ImportClientsPage />);
    expect(screen.getByText(/Téléverse ton fichier CSV/)).toBeTruthy();
  });

  it("input file accept=csv, required", () => {
    const { container } = render(<ImportClientsPage />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.required).toBe(true);
    expect(input.name).toBe('csvFile');
    expect(input.getAttribute('accept')).toContain('csv');
  });

  it("bouton 'Analyser le CSV' type=submit", () => {
    render(<ImportClientsPage />);
    const btn = screen.getByRole('button', { name: /Analyser le CSV/ });
    expect(btn.getAttribute('type')).toBe('submit');
  });

  it('au mount, pas de section mapping visible (pas de prévisualisation)', () => {
    render(<ImportClientsPage />);
    expect(screen.queryByText(/Mappe les colonnes/)).toBeNull();
    expect(screen.queryByText(/Lance l'import/)).toBeNull();
  });
});
