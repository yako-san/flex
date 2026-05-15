import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { Service } from '@prisma/client';

afterEach(() => cleanup());

vi.mock('./actions', () => ({
  createServiceAction: vi.fn().mockResolvedValue(null),
  updateServiceAction: vi.fn(() => vi.fn().mockResolvedValue(null)),
}));

import { ServiceForm } from './service-form';

const FULL_SERVICE = {
  id: 's1',
  workshopId: 'w1',
  labelCanonical: 'Mise au point',
  legacyCode: 'S00001',
  categorie: 'À la carte',
  categoriePrio: '1. Tune-up',
  dureeMinutes: 30,
  prix: '45.00',
  taxable: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
} as unknown as Service;

describe('ServiceForm', () => {
  it("mode création → bouton 'Créer le service'", () => {
    render(<ServiceForm />);
    expect(screen.getByRole('button', { name: /Créer le service/ })).toBeTruthy();
  });

  it("mode édition → bouton 'Enregistrer'", () => {
    render(<ServiceForm initial={FULL_SERVICE} />);
    expect(screen.getByRole('button', { name: /Enregistrer/ })).toBeTruthy();
  });

  it("labelCanonical et prix sont required", () => {
    const { container } = render(<ServiceForm />);
    const label = container.querySelector('input[name="labelCanonical"]') as HTMLInputElement;
    const prix = container.querySelector('input[name="prix"]') as HTMLInputElement;
    expect(label.required).toBe(true);
    expect(prix.required).toBe(true);
  });

  it("checkbox taxable cochée par défaut", () => {
    render(<ServiceForm />);
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.name).toBe('taxable');
    expect(checkbox.defaultChecked).toBe(true);
  });

  it("checkbox taxable mention 'TPS + TVQ'", () => {
    render(<ServiceForm />);
    expect(screen.getByText(/TPS \+ TVQ/)).toBeTruthy();
  });

  it("dureeMinutes type number min 0", () => {
    const { container } = render(<ServiceForm />);
    const duree = container.querySelector('input[name="dureeMinutes"]') as HTMLInputElement;
    expect(duree.type).toBe('number');
    expect(duree.min).toBe('0');
  });

  it("initial pré-remplit labelCanonical, legacyCode, categorie, prix", () => {
    render(<ServiceForm initial={FULL_SERVICE} />);
    expect(screen.getByDisplayValue('Mise au point')).toBeTruthy();
    expect(screen.getByDisplayValue('S00001')).toBeTruthy();
    expect(screen.getByDisplayValue('À la carte')).toBeTruthy();
    expect(screen.getByDisplayValue('45.00')).toBeTruthy();
  });

  it("placeholder labelCanonical contient emoji 🧰", () => {
    render(<ServiceForm />);
    const input = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    expect(input.placeholder).toContain('🧰');
  });

  it("placeholder categoriePrio mention 'matching pièces'", () => {
    render(<ServiceForm />);
    expect(screen.getByText(/matching pièces/)).toBeTruthy();
  });

  it("taxable=false sur initial → checkbox non coché", () => {
    render(<ServiceForm initial={{ ...FULL_SERVICE, taxable: false }} />);
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.defaultChecked).toBe(false);
  });
});
