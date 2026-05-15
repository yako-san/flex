import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('./actions', () => ({
  importDumpAction: vi.fn().mockResolvedValue(null),
}));

import { ImportForm } from './import-form';

describe('ImportForm', () => {
  it("input file name='dump', type=file, required, accept JSON", () => {
    const { container } = render(<ImportForm />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.name).toBe('dump');
    expect(input.required).toBe(true);
    expect(input.getAttribute('accept')).toContain('json');
  });

  it("bouton 'Lancer l'import' type=submit", () => {
    render(<ImportForm />);
    const btn = screen.getByRole('button', { name: /Lancer l/ });
    expect(btn.getAttribute('type')).toBe('submit');
  });

  it("label 'Fichier JSON du dump v1' visible", () => {
    render(<ImportForm />);
    expect(screen.getByText(/Fichier JSON du dump v1/)).toBeTruthy();
  });

  it('au mount, pas de résultat affiché', () => {
    render(<ImportForm />);
    expect(screen.queryByText('Import réussi')).toBeNull();
    expect(screen.queryByText(/Échec/)).toBeNull();
  });
});
