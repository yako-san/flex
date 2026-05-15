import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('../actions', () => ({
  createAdhocPoAction: vi.fn().mockResolvedValue(null),
}));

import { AdhocForm } from './adhoc-form';

const PIECES = [
  { id: 'p1', nomCanonical: 'Schwalbe Marathon 700', sku: '79-347' },
  { id: 'p2', nomCanonical: 'Shimano Deore', sku: null },
];
const CATS = ['Lubrification', 'Transmission'];

describe('AdhocForm', () => {
  it("rend le champ fournisseur required", () => {
    render(<AdhocForm pieces={PIECES} categories={CATS} />);
    const input = screen.getByPlaceholderText('Babac, MEC, etc.') as HTMLInputElement;
    expect(input.required).toBe(true);
    expect(input.name).toBe('fournisseur');
  });

  it('au mount, 1 item visible avec select pièce existante', () => {
    const { container } = render(<AdhocForm pieces={PIECES} categories={CATS} />);
    const selects = container.querySelectorAll('select');
    // 1 select pour pièce existante
    expect(selects.length).toBeGreaterThanOrEqual(1);
    expect(selects[0]!.options[0]!.value).toBe('');
    expect(selects[0]!.options[0]!.text).toContain('Nouvelle pièce');
  });

  it('pièces du catalogue peuplent le select', () => {
    const { container } = render(<AdhocForm pieces={PIECES} categories={CATS} />);
    const select = container.querySelector('select') as HTMLSelectElement;
    // 1 option vide + 2 pièces
    expect(select.options.length).toBe(3);
    expect(select.options[1]!.value).toBe('p1');
  });

  it("bouton '+ Ajouter un item' ajoute un 2e item", () => {
    render(<AdhocForm pieces={PIECES} categories={CATS} />);
    const addBtn = screen.getByRole('button', { name: /Ajouter un item/ });
    fireEvent.click(addBtn);
    // Après ajout, on a 2 items donc le bouton retirer apparaît
    expect(screen.getAllByRole('button', { name: /Retirer cet item/ }).length).toBe(2);
  });

  it("bouton 'Retirer cet item' absent si 1 seul item", () => {
    render(<AdhocForm pieces={PIECES} categories={CATS} />);
    expect(screen.queryByRole('button', { name: /Retirer cet item/ })).toBeNull();
  });

  it('notes textarea rows=2 en bas du form', () => {
    const { container } = render(<AdhocForm pieces={PIECES} categories={CATS} />);
    const textarea = container.querySelector('textarea[name="notes"]') as HTMLTextAreaElement;
    expect(Number(textarea.getAttribute('rows'))).toBe(2);
  });

  it("bouton submit contient '📦 Créer ADHOC'", () => {
    render(<AdhocForm pieces={PIECES} categories={CATS} />);
    const btn = screen.getByRole('button', { name: /Créer ADHOC/ });
    expect(btn.getAttribute('type')).toBe('submit');
  });

  it("item: qty type=number, step=0.01, min=0.01, required", () => {
    const { container } = render(<AdhocForm pieces={PIECES} categories={CATS} />);
    const qtyInput = container.querySelector('input[type="number"][min="0.01"]') as HTMLInputElement;
    expect(qtyInput.required).toBe(true);
    expect(qtyInput.step).toBe('0.01');
  });
});
