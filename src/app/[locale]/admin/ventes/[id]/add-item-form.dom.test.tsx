import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('../actions', () => ({
  addVenteItemAction: vi.fn().mockResolvedValue(null),
}));

import { AddItemForm } from './add-item-form';

const ENTRIES = [
  { kind: 'service' as const, id: 'srv1', sku: 'S00012', nom: 'Mise au point', prix: 65 },
  { kind: 'piece' as const, id: 'p1', sku: '79-347', nom: 'Schwalbe Marathon 700', prix: 45.99 },
  { kind: 'piece' as const, id: 'p2', sku: null, nom: 'Shimano Deore', prix: 80 },
];

describe('AddItemForm — picker unifié pièces + services (cluster 4 n+o)', () => {
  it('hidden input venteId avec valeur correcte', () => {
    const { container } = render(<AddItemForm venteId="v42" entries={ENTRIES} />);
    const hidden = container.querySelector('input[name="venteId"]') as HTMLInputElement;
    expect(hidden.type).toBe('hidden');
    expect(hidden.value).toBe('v42');
  });

  it('select itemRef required avec placeholder désactivé', () => {
    const { container } = render(<AddItemForm venteId="v1" entries={ENTRIES} />);
    const select = container.querySelector('select[name="itemRef"]') as HTMLSelectElement;
    expect(select.required).toBe(true);
    expect(select.options[0]!.value).toBe('');
    expect(select.options[0]!.disabled).toBe(true);
  });

  it('entries peuplent le select avec valeurs préfixées kind:id', () => {
    const { container } = render(<AddItemForm venteId="v1" entries={ENTRIES} />);
    const select = container.querySelector('select[name="itemRef"]') as HTMLSelectElement;
    expect(select.options.length).toBe(4); // placeholder + 3 entries
    expect(select.options[1]!.value).toBe('service:srv1');
    expect(select.options[1]!.text).toContain('🧰');
    expect(select.options[1]!.text).toContain('Mise au point');
    expect(select.options[2]!.value).toBe('piece:p1');
    expect(select.options[2]!.text).toContain('⚙️');
    expect(select.options[2]!.text).toContain('Schwalbe');
  });

  it('qty type=number, step=1, min=1, defaultValue=1, required', () => {
    const { container } = render(<AddItemForm venteId="v1" entries={ENTRIES} />);
    const qty = container.querySelector('input[name="qty"]') as HTMLInputElement;
    expect(qty.type).toBe('number');
    expect(qty.step).toBe('1');
    expect(qty.min).toBe('1');
    expect(Number(qty.defaultValue)).toBe(1);
    expect(qty.required).toBe(true);
  });

  it('prix override disabled tant qu\'aucun item sélectionné', () => {
    const { container } = render(<AddItemForm venteId="v1" entries={ENTRIES} />);
    const prix = container.querySelector('input[name="prixOverride"]') as HTMLInputElement;
    expect(prix.disabled).toBe(true);
  });

  it('prix override devient actif quand un item est sélectionné', () => {
    const { container } = render(<AddItemForm venteId="v1" entries={ENTRIES} />);
    const select = container.querySelector('select[name="itemRef"]') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'piece:p1' } });
    const prix = container.querySelector('input[name="prixOverride"]') as HTMLInputElement;
    expect(prix.disabled).toBe(false);
    // Placeholder = prix catalogue formaté
    expect(prix.placeholder).toBe('45.99');
  });

  it('bouton 🆓 set prix à 0 puis revient au catalogue au toggle', () => {
    const { container } = render(<AddItemForm venteId="v1" entries={ENTRIES} />);
    const select = container.querySelector('select[name="itemRef"]') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'piece:p1' } });
    const freeBtn = screen.getByRole('button', { name: /Marquer comme inclus/ }) as HTMLButtonElement;
    fireEvent.click(freeBtn);
    const prix = container.querySelector('input[name="prixOverride"]') as HTMLInputElement;
    expect(prix.value).toBe('0');
    expect(freeBtn.getAttribute('aria-pressed')).toBe('true');
    // Affichage "inclus" italique
    expect(container.textContent).toContain('(inclus)');
    // Toggle off — retour au placeholder catalogue
    fireEvent.click(freeBtn);
    expect(prix.value).toBe('');
    expect(freeBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it("changer d'item reset le prix override (évite override accidentel)", () => {
    const { container } = render(<AddItemForm venteId="v1" entries={ENTRIES} />);
    const select = container.querySelector('select[name="itemRef"]') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'piece:p1' } });
    fireEvent.click(screen.getByRole('button', { name: /Marquer comme inclus/ }));
    const prix = container.querySelector('input[name="prixOverride"]') as HTMLInputElement;
    expect(prix.value).toBe('0');
    fireEvent.change(select, { target: { value: 'piece:p2' } });
    expect(prix.value).toBe('');
  });

  it("bouton '+ Ajouter' type=submit, non disabled par défaut", () => {
    render(<AddItemForm venteId="v1" entries={ENTRIES} />);
    const btn = screen.getByRole('button', { name: /\+ Ajouter/ }) as HTMLButtonElement;
    expect(btn.getAttribute('type')).toBe('submit');
    expect(btn.disabled).toBe(false);
  });

  it('au mount, pas de message erreur', () => {
    render(<AddItemForm venteId="v1" entries={ENTRIES} />);
    expect(screen.queryByText(/erreur/i)).toBeNull();
  });
});
