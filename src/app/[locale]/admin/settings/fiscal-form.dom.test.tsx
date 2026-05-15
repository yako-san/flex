import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('./fiscal-actions', () => ({
  updateFiscalAction: vi.fn().mockResolvedValue(null),
}));

import { FiscalForm } from './fiscal-form';

const INITIAL = {
  raisonSociale: 'Jean-Christophe Yacono',
  neq: '9876543210',
  tps: '123456789RT0001',
  tvq: '9876543210TQ0001',
  adresseLigne1: '4109, rue Saint-Denis',
  ville: 'Montréal',
  province: 'Québec',
  codePostal: 'H2W 2M7',
  pays: 'Canada',
  telephone: '514 995-3445',
  courriel: 'contact@yako.cyclo',
  footerText: 'Merci de votre visite !',
};

describe('FiscalForm', () => {
  it("sections Identité légale, Adresse, Contact, Footer présentes", () => {
    render(<FiscalForm initial={INITIAL} />);
    expect(screen.getByText('Identité légale')).toBeTruthy();
    expect(screen.getByText('Adresse')).toBeTruthy();
    expect(screen.getByText('Contact')).toBeTruthy();
    expect(screen.getByText('Footer PDF')).toBeTruthy();
  });

  it("input raisonSociale pré-rempli", () => {
    const { container } = render(<FiscalForm initial={INITIAL} />);
    const input = container.querySelector('input[name="raisonSociale"]') as HTMLInputElement;
    expect(input.defaultValue).toBe('Jean-Christophe Yacono');
  });

  it("input courriel type=email", () => {
    const { container } = render(<FiscalForm initial={INITIAL} />);
    const input = container.querySelector('input[name="courriel"]') as HTMLInputElement;
    expect(input.type).toBe('email');
  });

  it("footerText textarea rows=3 pré-rempli", () => {
    const { container } = render(<FiscalForm initial={INITIAL} />);
    const textarea = container.querySelector('textarea[name="footerText"]') as HTMLTextAreaElement;
    expect(Number(textarea.getAttribute('rows'))).toBe(3);
    expect(textarea.defaultValue).toBe('Merci de votre visite !');
  });

  it("bouton 'Enregistrer' type=submit", () => {
    render(<FiscalForm initial={INITIAL} />);
    const btn = screen.getByRole('button', { name: /Enregistrer/ });
    expect(btn.getAttribute('type')).toBe('submit');
  });

  it("au mount, pas de message erreur ni succès", () => {
    render(<FiscalForm initial={INITIAL} />);
    expect(screen.queryByText(/✓/)).toBeNull();
  });

  it("input tps et tvq pré-remplis", () => {
    const { container } = render(<FiscalForm initial={INITIAL} />);
    expect((container.querySelector('input[name="tps"]') as HTMLInputElement).defaultValue).toBe('123456789RT0001');
    expect((container.querySelector('input[name="tvq"]') as HTMLInputElement).defaultValue).toBe('9876543210TQ0001');
  });
});
