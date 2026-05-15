import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('../actions', () => ({
  addBdtItemAction: vi.fn().mockResolvedValue(null),
}));

import { AddItemForm } from './add-item-form';

const SERVICES = [
  { id: 's1', label: 'Mise au point' },
  { id: 's2', label: 'Réglage' },
];
const PIECES = [{ id: 'p1', label: 'Chambre à air' }];
const FORFAITS = [{ id: 'f1', label: 'Tune-up complet' }];

describe('AddItemForm', () => {
  it("rend 3 selects (kind/refId) + qty + bouton submit", () => {
    render(
      <AddItemForm bdcId="b1" services={SERVICES} pieces={PIECES} forfaits={FORFAITS} />,
    );
    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(2); // kind + refId
    expect(screen.getByRole('spinbutton')).toBeTruthy(); // qty input number
    expect(screen.getByRole('button', { name: /Ajouter/ })).toBeTruthy();
  });

  it("kind par défaut = SERVICE → options service affichées", () => {
    render(
      <AddItemForm bdcId="b1" services={SERVICES} pieces={PIECES} forfaits={FORFAITS} />,
    );
    expect(screen.getByText('Mise au point')).toBeTruthy();
    expect(screen.queryByText('Chambre à air')).toBeNull();
  });

  it("changement vers PIECE → options pièces affichées", () => {
    render(
      <AddItemForm bdcId="b1" services={SERVICES} pieces={PIECES} forfaits={FORFAITS} />,
    );
    const kindSelect = screen.getAllByRole('combobox')[0]!;
    fireEvent.change(kindSelect, { target: { value: 'PIECE' } });
    expect(screen.getByText('Chambre à air')).toBeTruthy();
    expect(screen.queryByText('Mise au point')).toBeNull();
  });

  it("changement vers FORFAIT → options forfait affichées", () => {
    render(
      <AddItemForm bdcId="b1" services={SERVICES} pieces={PIECES} forfaits={FORFAITS} />,
    );
    const kindSelect = screen.getAllByRole('combobox')[0]!;
    fireEvent.change(kindSelect, { target: { value: 'FORFAIT' } });
    expect(screen.getByText('Tune-up complet')).toBeTruthy();
  });

  it("input bdcId hidden injecté avec la value", () => {
    const { container } = render(
      <AddItemForm bdcId="b42" services={SERVICES} pieces={PIECES} forfaits={FORFAITS} />,
    );
    const hidden = container.querySelector('input[name="bdcId"]') as HTMLInputElement;
    expect(hidden.type).toBe('hidden');
    expect(hidden.value).toBe('b42');
  });

  it("qty par défaut = 1, step=0.01, min=0.01", () => {
    render(
      <AddItemForm bdcId="b1" services={SERVICES} pieces={PIECES} forfaits={FORFAITS} />,
    );
    const qty = screen.getByRole('spinbutton') as HTMLInputElement;
    expect(qty.value).toBe('1');
    expect(qty.getAttribute('step')).toBe('0.01');
    expect(qty.getAttribute('min')).toBe('0.01');
  });

  it("refId est required", () => {
    render(
      <AddItemForm bdcId="b1" services={SERVICES} pieces={PIECES} forfaits={FORFAITS} />,
    );
    const refIdSelect = screen.getAllByRole('combobox')[1] as HTMLSelectElement;
    expect(refIdSelect.required).toBe(true);
  });

  it("label change selon le kind sélectionné", () => {
    render(
      <AddItemForm bdcId="b1" services={SERVICES} pieces={PIECES} forfaits={FORFAITS} />,
    );
    expect(screen.getByText('Service *')).toBeTruthy();
    const kindSelect = screen.getAllByRole('combobox')[0]!;
    fireEvent.change(kindSelect, { target: { value: 'PIECE' } });
    expect(screen.getByText('Pièce *')).toBeTruthy();
  });

  it("liste services vide → pas d'option produit visible (juste placeholder)", () => {
    render(
      <AddItemForm bdcId="b1" services={[]} pieces={PIECES} forfaits={FORFAITS} />,
    );
    const refIdSelect = screen.getAllByRole('combobox')[1] as HTMLSelectElement;
    expect(refIdSelect.options.length).toBe(1); // juste "— choisir —"
    expect(refIdSelect.options[0]!.value).toBe('');
  });
});
