import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('./actions', () => ({
  createMarqueAction: vi.fn().mockResolvedValue(null),
  updateMarqueAction: vi.fn(() => vi.fn().mockResolvedValue(null)),
}));

import { MarqueForm } from './marque-form';

describe('MarqueForm', () => {
  it("mode création → bouton 'Créer la marque'", () => {
    render(<MarqueForm />);
    expect(screen.getByRole('button', { name: /Créer la marque/ })).toBeTruthy();
  });

  it("mode édition (initial fourni) → bouton 'Enregistrer'", () => {
    render(<MarqueForm initial={{ id: 'm1', nom: 'Trek' }} />);
    expect(screen.getByRole('button', { name: /Enregistrer/ })).toBeTruthy();
  });

  it("initial.nom pré-rempli", () => {
    render(<MarqueForm initial={{ id: 'm1', nom: 'Trek' }} />);
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    expect(inputs[0]!.value).toBe('Trek');
  });

  it("nom est required", () => {
    render(<MarqueForm />);
    const input = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    expect(input.required).toBe(true);
    expect(input.name).toBe('nom');
  });

  it("taillesDisponibles joinées par virgule", () => {
    render(
      <MarqueForm initial={{ id: 'm1', nom: 'Trek', taillesDisponibles: ['S', 'M', 'L'] }} />,
    );
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    expect(inputs[1]!.value).toBe('S, M, L');
  });

  it("taillesDisponibles non fourni → champ vide", () => {
    render(<MarqueForm initial={{ id: 'm1', nom: 'Trek' }} />);
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    expect(inputs[1]!.value).toBe('');
  });

  it("placeholder tailles → XS, S, M ou 48, 51, 54", () => {
    render(<MarqueForm />);
    const placeholder = (screen.getAllByRole('textbox')[1] as HTMLInputElement).placeholder;
    expect(placeholder).toContain('XS');
    expect(placeholder).toContain('48');
  });

  it("description mentionne dropdown vélo", () => {
    render(<MarqueForm />);
    expect(screen.getByText(/dropdown dans le formulaire vélo/)).toBeTruthy();
  });
});
