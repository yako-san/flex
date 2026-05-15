import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Forfait } from '@prisma/client';

afterEach(() => cleanup());

vi.mock('./actions', () => ({
  createForfaitAction: vi.fn().mockResolvedValue(null),
  updateForfaitAction: vi.fn(() => vi.fn().mockResolvedValue(null)),
}));

import { ForfaitForm } from './forfait-form';

const FULL_FORFAIT = {
  id: 'f1',
  workshopId: 'w1',
  labelCanonical: 'Tune-up complet',
  legacyCode: 'S00001',
  dureeMinutes: 60,
  prix: '85.00',
  taxable: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
} as unknown as Forfait;

describe('ForfaitForm', () => {
  it("mode création → bouton 'Créer le forfait'", () => {
    render(<ForfaitForm />);
    expect(screen.getByRole('button', { name: /Créer le forfait/ })).toBeTruthy();
  });

  it("mode édition → bouton 'Enregistrer'", () => {
    render(<ForfaitForm initial={FULL_FORFAIT} />);
    expect(screen.getByRole('button', { name: /Enregistrer/ })).toBeTruthy();
  });

  it("labelCanonical et prix sont required", () => {
    const { container } = render(<ForfaitForm />);
    const label = container.querySelector('input[name="labelCanonical"]') as HTMLInputElement;
    const prix = container.querySelector('input[name="prix"]') as HTMLInputElement;
    expect(label.required).toBe(true);
    expect(prix.required).toBe(true);
  });

  it("prix input type number step 0.01 min 0", () => {
    const { container } = render(<ForfaitForm />);
    const prix = container.querySelector('input[name="prix"]') as HTMLInputElement;
    expect(prix.type).toBe('number');
    expect(prix.step).toBe('0.01');
    expect(prix.min).toBe('0');
  });

  it("checkbox taxable cochée par défaut en création", () => {
    render(<ForfaitForm />);
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.name).toBe('taxable');
    expect(checkbox.defaultChecked).toBe(true);
  });

  it("initialTasks pré-rempli", () => {
    render(
      <ForfaitForm
        initialTasks={[{ labelCanonical: 'Tâche A' }, { labelCanonical: 'Tâche B' }]}
      />,
    );
    expect(screen.getByDisplayValue('Tâche A')).toBeTruthy();
    expect(screen.getByDisplayValue('Tâche B')).toBeTruthy();
  });

  it("bouton 'Ajouter une sous-tâche' → ajoute un input vide", () => {
    render(<ForfaitForm initialTasks={[{ labelCanonical: 'Tâche A' }]} />);
    fireEvent.click(screen.getByRole('button', { name: /Ajouter une sous-tâche/ }));
    const inputs = screen.getAllByPlaceholderText(/évaluation de l'état général/);
    expect(inputs).toHaveLength(2);
  });

  it("bouton ✕ → supprime la sous-tâche correspondante", () => {
    render(
      <ForfaitForm
        initialTasks={[{ labelCanonical: 'Tâche A' }, { labelCanonical: 'Tâche B' }]}
      />,
    );
    const removeBtns = screen.getAllByRole('button', { name: '✕' });
    expect(removeBtns).toHaveLength(2);
    fireEvent.click(removeBtns[0]!);
    expect(screen.queryByDisplayValue('Tâche A')).toBeNull();
    expect(screen.getByDisplayValue('Tâche B')).toBeTruthy();
  });

  it("aucun task au départ → liste vide + bouton add", () => {
    render(<ForfaitForm />);
    expect(screen.queryByPlaceholderText(/évaluation de l'état général/)).toBeNull();
    expect(screen.getByRole('button', { name: /Ajouter une sous-tâche/ })).toBeTruthy();
  });

  it("modifier le label d'une tâche → input reflète", () => {
    render(<ForfaitForm initialTasks={[{ labelCanonical: 'A' }]} />);
    const input = screen.getByDisplayValue('A') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'A modifié' } });
    expect(input.value).toBe('A modifié');
  });
});
