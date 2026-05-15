import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { Client } from '@prisma/client';

afterEach(() => cleanup());

vi.mock('./actions', () => ({
  createClientAction: vi.fn().mockResolvedValue(null),
  updateClientAction: vi.fn(() => vi.fn().mockResolvedValue(null)),
}));

import { ClientForm } from './client-form';

const FULL_CLIENT = {
  id: 'c1',
  workshopId: 'w1',
  prenom: 'Marie',
  nom: 'Tremblay',
  telephone: '5141234567',
  indicatif: '+1',
  courriel: 'marie@ex.ca',
  commPref: 'EMAIL',
  lang: 'fr-CA',
  lead: 'yako.cyclo',
  remiseDefault: '5.00',
  notes: 'VIP',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
} as unknown as Client;

describe('ClientForm', () => {
  it("mode création → bouton 'Créer le client'", () => {
    render(<ClientForm />);
    expect(screen.getByRole('button', { name: /Créer le client/ })).toBeTruthy();
  });

  it("mode édition → bouton 'Enregistrer'", () => {
    render(<ClientForm initial={FULL_CLIENT} />);
    expect(screen.getByRole('button', { name: /Enregistrer/ })).toBeTruthy();
  });

  it("prenom et nom sont required", () => {
    const { container } = render(<ClientForm />);
    const prenom = container.querySelector('input[name="prenom"]') as HTMLInputElement;
    const nom = container.querySelector('input[name="nom"]') as HTMLInputElement;
    expect(prenom.required).toBe(true);
    expect(nom.required).toBe(true);
  });

  it("indicatif par défaut '+1' en création", () => {
    const { container } = render(<ClientForm />);
    const indicatif = container.querySelector('input[name="indicatif"]') as HTMLInputElement;
    expect(indicatif.defaultValue).toBe('+1');
  });

  it("courriel type=email", () => {
    const { container } = render(<ClientForm />);
    const courriel = container.querySelector('input[name="courriel"]') as HTMLInputElement;
    expect(courriel.type).toBe('email');
  });

  it("select commPref avec 4 options", () => {
    const { container } = render(<ClientForm />);
    const select = container.querySelector('select[name="commPref"]') as HTMLSelectElement;
    expect(select.options.length).toBe(4);
    expect([...select.options].map((o) => o.value)).toEqual(['EMAIL', 'SMS', 'TELEPHONE', 'AUCUN']);
  });

  it("select commPref défaut 'EMAIL' en création", () => {
    const { container } = render(<ClientForm />);
    const select = container.querySelector('select[name="commPref"]') as HTMLSelectElement;
    expect(select.value).toBe('EMAIL');
  });

  it("select lang avec 2 options (fr-CA, en-CA)", () => {
    const { container } = render(<ClientForm />);
    const select = container.querySelector('select[name="lang"]') as HTMLSelectElement;
    expect(select.options.length).toBe(2);
    expect(select.value).toBe('fr-CA');
  });

  it("remiseDefault type number min 0 max 100", () => {
    const { container } = render(<ClientForm />);
    const remise = container.querySelector('input[name="remiseDefault"]') as HTMLInputElement;
    expect(remise.type).toBe('number');
    expect(remise.min).toBe('0');
    expect(remise.max).toBe('100');
    expect(remise.step).toBe('0.01');
  });

  it("initial pré-remplit tous les champs", () => {
    const { container } = render(<ClientForm initial={FULL_CLIENT} />);
    expect((container.querySelector('input[name="prenom"]') as HTMLInputElement).defaultValue).toBe('Marie');
    expect((container.querySelector('input[name="nom"]') as HTMLInputElement).defaultValue).toBe('Tremblay');
    expect((container.querySelector('input[name="telephone"]') as HTMLInputElement).defaultValue).toBe('5141234567');
    expect((container.querySelector('input[name="courriel"]') as HTMLInputElement).defaultValue).toBe('marie@ex.ca');
  });

  it("commPref initial SMS → select reflète", () => {
    const { container } = render(
      <ClientForm initial={{ ...FULL_CLIENT, commPref: 'SMS' }} />,
    );
    const select = container.querySelector('select[name="commPref"]') as HTMLSelectElement;
    expect(select.value).toBe('SMS');
  });

  it("notes textarea avec rows=3", () => {
    const { container } = render(<ClientForm />);
    const textarea = container.querySelector('textarea[name="notes"]') as HTMLTextAreaElement;
    expect(Number(textarea.getAttribute('rows'))).toBe(3);
  });
});
