import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('../actions', () => ({
  createVenteAction: vi.fn().mockResolvedValue(null),
}));

import { VenteForm } from './vente-form';

const CLIENTS = [
  { id: 'c1', prenom: 'Marie', nom: 'Tremblay' },
  { id: 'c2', prenom: 'Jean', nom: 'Dupont' },
];

describe('VenteForm', () => {
  it("select clientId avec placeholder '— Aucun (walk-in) —'", () => {
    const { container } = render(<VenteForm clients={CLIENTS} />);
    const select = container.querySelector('select[name="clientId"]') as HTMLSelectElement;
    expect(select.options[0]!.value).toBe('');
    expect(select.options[0]!.text).toContain('walk-in');
  });

  it('clients peuplent le select (1 vide + 2 clients)', () => {
    const { container } = render(<VenteForm clients={CLIENTS} />);
    const select = container.querySelector('select[name="clientId"]') as HTMLSelectElement;
    expect(select.options.length).toBe(3);
    expect(select.options[1]!.value).toBe('c1');
    expect(select.options[1]!.text).toContain('Marie Tremblay');
  });

  it('notes textarea rows=3', () => {
    const { container } = render(<VenteForm clients={CLIENTS} />);
    const textarea = container.querySelector('textarea[name="notes"]') as HTMLTextAreaElement;
    expect(Number(textarea.getAttribute('rows'))).toBe(3);
  });

  it("bouton 'Créer la vente' type=submit", () => {
    render(<VenteForm clients={CLIENTS} />);
    const btn = screen.getByRole('button', { name: /Créer la vente/ });
    expect(btn.getAttribute('type')).toBe('submit');
  });

  it('au mount pas de message erreur', () => {
    render(<VenteForm clients={CLIENTS} />);
    expect(screen.queryByText(/erreur/i)).toBeNull();
  });

  it('sans clients → select a seulement le placeholder', () => {
    const { container } = render(<VenteForm clients={[]} />);
    const select = container.querySelector('select[name="clientId"]') as HTMLSelectElement;
    expect(select.options.length).toBe(1);
  });
});
