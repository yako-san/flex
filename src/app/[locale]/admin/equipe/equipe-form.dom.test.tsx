import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { EquipeMember } from '@prisma/client';

afterEach(() => cleanup());

vi.mock('./actions', () => ({
  createEquipeAction: vi.fn().mockResolvedValue(null),
  updateEquipeAction: vi.fn(() => vi.fn().mockResolvedValue(null)),
}));

import { EquipeForm } from './equipe-form';

const FULL_MEMBER = {
  id: 'em1',
  workshopId: 'w1',
  prenom: 'Yako',
  nom: 'San',
  surnom: 'yako',
  role: 'Patron',
  indicatif: '+1',
  telephone: '5141234567',
  courriel: 'yako@test.ca',
  lang: 'fr-CA',
  active: true,
  notes: 'Note interne',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
} as unknown as EquipeMember;

describe('EquipeForm', () => {
  it("mode création → bouton 'Créer le membre'", () => {
    render(<EquipeForm />);
    expect(screen.getByRole('button', { name: /Créer le membre/ })).toBeTruthy();
  });

  it("mode édition → bouton 'Enregistrer'", () => {
    render(<EquipeForm initial={FULL_MEMBER} />);
    expect(screen.getByRole('button', { name: /Enregistrer/ })).toBeTruthy();
  });

  it("3 champs required (prenom, nom, surnom)", () => {
    render(<EquipeForm />);
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    const required = inputs.filter((i) => i.required);
    expect(required.map((i) => i.name)).toContain('prenom');
    expect(required.map((i) => i.name)).toContain('nom');
    expect(required.map((i) => i.name)).toContain('surnom');
  });

  it("indicatif par défaut '+1' en mode création", () => {
    render(<EquipeForm />);
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    const indicatif = inputs.find((i) => i.name === 'indicatif');
    expect(indicatif?.value).toBe('+1');
  });

  it("select langue avec 2 options fr-CA + en-CA", () => {
    render(<EquipeForm />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.name).toBe('lang');
    expect(select.options.length).toBe(2);
    expect(select.options[0]!.value).toBe('fr-CA');
    expect(select.options[1]!.value).toBe('en-CA');
  });

  it("checkbox active coché par défaut en création", () => {
    render(<EquipeForm />);
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.name).toBe('active');
    expect(checkbox.defaultChecked).toBe(true);
  });

  it("active=false sur initial → checkbox non coché", () => {
    render(<EquipeForm initial={{ ...FULL_MEMBER, active: false }} />);
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.defaultChecked).toBe(false);
  });

  it("initial pré-remplit tous les champs", () => {
    render(<EquipeForm initial={FULL_MEMBER} />);
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    expect(inputs.find((i) => i.name === 'prenom')?.value).toBe('Yako');
    expect(inputs.find((i) => i.name === 'nom')?.value).toBe('San');
    expect(inputs.find((i) => i.name === 'surnom')?.value).toBe('yako');
    expect(inputs.find((i) => i.name === 'role')?.value).toBe('Patron');
  });

  it("input courriel type=email", () => {
    render(<EquipeForm />);
    const inputs = screen.getAllByDisplayValue('') as HTMLInputElement[];
    const courriel = inputs.find((i) => i.name === 'courriel');
    expect(courriel?.type).toBe('email');
  });
});
