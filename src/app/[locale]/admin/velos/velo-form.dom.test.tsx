import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { Velo } from '@prisma/client';

afterEach(() => cleanup());

vi.mock('./actions', () => ({
  createVeloAction: vi.fn().mockResolvedValue(null),
  updateVeloAction: vi.fn(() => vi.fn().mockResolvedValue(null)),
}));

import { VeloForm } from './velo-form';

const CLIENTS = [
  { id: 'c1', prenom: 'Marie', nom: 'Tremblay' },
  { id: 'c2', prenom: 'Jean', nom: 'Dupont' },
];
const MARQUES = [
  { id: 'm1', nom: 'Trek', taillesDisponibles: ['S', 'M', 'L'] },
  { id: 'm2', nom: 'Specialized', taillesDisponibles: [] },
];
const EQUIPE = [
  { id: 'e1', surnom: 'Yako' },
  { id: 'e2', surnom: 'Sam' },
];

const FULL_VELO = {
  id: 'v1',
  workshopId: 'w1',
  veloNumero: 42,
  clientId: 'c1',
  marqueId: 'm1',
  modele: 'Marlin 7',
  couleur: 'Rouge',
  taille: 'M',
  numeroSerie: 'SN001',
  status: 'EVAL',
  evalMecanoId: 'e1',
  mecaMecanoId: null,
  ctrlMecanoId: null,
  noteVelo: 'Note vélo',
  notes: 'Notes libres',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
} as unknown as Velo;

describe('VeloForm', () => {
  it("mode création → bouton 'Créer le vélo'", () => {
    render(<VeloForm clients={CLIENTS} marques={MARQUES} equipe={EQUIPE} />);
    expect(screen.getByRole('button', { name: /Créer le vélo/ })).toBeTruthy();
  });

  it("mode édition → bouton 'Enregistrer'", () => {
    render(<VeloForm initial={FULL_VELO} clients={CLIENTS} marques={MARQUES} equipe={EQUIPE} />);
    expect(screen.getByRole('button', { name: /Enregistrer/ })).toBeTruthy();
  });

  it('select clientId required avec placeholder', () => {
    const { container } = render(<VeloForm clients={CLIENTS} marques={MARQUES} equipe={EQUIPE} />);
    const select = container.querySelector('select[name="clientId"]') as HTMLSelectElement;
    expect(select.required).toBe(true);
    expect(select.options[0]!.value).toBe('');
    expect(select.options[0]!.text).toContain('sélectionner un client');
  });

  it('clients peuplent le select (1 vide + 2 clients)', () => {
    const { container } = render(<VeloForm clients={CLIENTS} marques={MARQUES} equipe={EQUIPE} />);
    const select = container.querySelector('select[name="clientId"]') as HTMLSelectElement;
    expect(select.options.length).toBe(3);
    expect(select.options[1]!.value).toBe('c1');
  });

  it('defaultClientId pré-sélectionne le client', () => {
    const { container } = render(<VeloForm defaultClientId="c2" clients={CLIENTS} marques={MARQUES} equipe={EQUIPE} />);
    const select = container.querySelector('select[name="clientId"]') as HTMLSelectElement;
    expect(select.value).toBe('c2');
  });

  it('select status défaut RV en création avec 11 options', () => {
    const { container } = render(<VeloForm clients={CLIENTS} marques={MARQUES} equipe={EQUIPE} />);
    const select = container.querySelector('select[name="status"]') as HTMLSelectElement;
    expect(select.value).toBe('RV');
    expect(select.options.length).toBe(11);
  });

  it('3 selects mécaniciens (eval, meca, ctrl) avec options équipe', () => {
    const { container } = render(<VeloForm clients={CLIENTS} marques={MARQUES} equipe={EQUIPE} />);
    const evalSelect = container.querySelector('select[name="evalMecanoId"]') as HTMLSelectElement;
    const mecaSelect = container.querySelector('select[name="mecaMecanoId"]') as HTMLSelectElement;
    const ctrlSelect = container.querySelector('select[name="ctrlMecanoId"]') as HTMLSelectElement;
    // 1 vide + 2 membres d'équipe
    expect(evalSelect.options.length).toBe(3);
    expect(mecaSelect.options.length).toBe(3);
    expect(ctrlSelect.options.length).toBe(3);
  });

  it('noteVelo textarea rows=2', () => {
    const { container } = render(<VeloForm clients={CLIENTS} marques={MARQUES} equipe={EQUIPE} />);
    const textarea = container.querySelector('textarea[name="noteVelo"]') as HTMLTextAreaElement;
    expect(Number(textarea.getAttribute('rows'))).toBe(2);
  });

  it('notes textarea rows=3', () => {
    const { container } = render(<VeloForm clients={CLIENTS} marques={MARQUES} equipe={EQUIPE} />);
    const textarea = container.querySelector('textarea[name="notes"]') as HTMLTextAreaElement;
    expect(Number(textarea.getAttribute('rows'))).toBe(3);
  });

  it('initial pré-remplit modele, couleur, taille', () => {
    const { container } = render(<VeloForm initial={FULL_VELO} clients={CLIENTS} marques={MARQUES} equipe={EQUIPE} />);
    expect((container.querySelector('input[name="modele"]') as HTMLInputElement).defaultValue).toBe('Marlin 7');
    expect((container.querySelector('input[name="couleur"]') as HTMLInputElement).defaultValue).toBe('Rouge');
    expect((container.querySelector('input[name="taille"]') as HTMLInputElement).defaultValue).toBe('M');
  });
});
