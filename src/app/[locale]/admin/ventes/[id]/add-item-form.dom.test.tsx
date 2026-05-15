import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('../actions', () => ({
  addVenteItemAction: vi.fn().mockResolvedValue(null),
}));

import { AddItemForm } from './add-item-form';

const PIECES = [
  { id: 'p1', label: '[79-347] Schwalbe Marathon 700' },
  { id: 'p2', label: 'Shimano Deore' },
];

describe('AddItemForm', () => {
  it("hidden input venteId avec valeur correcte", () => {
    const { container } = render(<AddItemForm venteId="v42" pieces={PIECES} />);
    const hidden = container.querySelector('input[name="venteId"]') as HTMLInputElement;
    expect(hidden.type).toBe('hidden');
    expect(hidden.value).toBe('v42');
  });

  it("select pieceId required avec placeholder désactivé", () => {
    const { container } = render(<AddItemForm venteId="v1" pieces={PIECES} />);
    const select = container.querySelector('select[name="pieceId"]') as HTMLSelectElement;
    expect(select.required).toBe(true);
    expect(select.options[0]!.value).toBe('');
    expect(select.options[0]!.disabled).toBe(true);
  });

  it("pièces peuplent le select (1 placeholder + 2 pièces)", () => {
    const { container } = render(<AddItemForm venteId="v1" pieces={PIECES} />);
    const select = container.querySelector('select[name="pieceId"]') as HTMLSelectElement;
    expect(select.options.length).toBe(3);
    expect(select.options[1]!.value).toBe('p1');
    expect(select.options[1]!.text).toContain('Schwalbe');
  });

  it("qty type=number, step=1, min=1, defaultValue=1, required", () => {
    const { container } = render(<AddItemForm venteId="v1" pieces={PIECES} />);
    const qty = container.querySelector('input[name="qty"]') as HTMLInputElement;
    expect(qty.type).toBe('number');
    expect(qty.step).toBe('1');
    expect(qty.min).toBe('1');
    expect(Number(qty.defaultValue)).toBe(1);
    expect(qty.required).toBe(true);
  });

  it("bouton '+ Ajouter' type=submit, non disabled par défaut", () => {
    render(<AddItemForm venteId="v1" pieces={PIECES} />);
    const btn = screen.getByRole('button', { name: /Ajouter/ }) as HTMLButtonElement;
    expect(btn.getAttribute('type')).toBe('submit');
    expect(btn.disabled).toBe(false);
  });

  it("au mount, pas de message erreur", () => {
    render(<AddItemForm venteId="v1" pieces={PIECES} />);
    expect(screen.queryByText(/erreur/i)).toBeNull();
  });
});
