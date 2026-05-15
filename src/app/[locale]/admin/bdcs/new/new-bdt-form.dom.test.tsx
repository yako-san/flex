import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('../actions', () => ({
  createBdtAction: vi.fn().mockResolvedValue(null),
}));

import { NewBdtForm } from './new-bdt-form';

const VELOS = [
  { id: 'v1', label: 'Trek Marlin 7 (2021) — Marie Tremblay' },
  { id: 'v2', label: 'Specialized Sirrus — Jean Dupont' },
];

describe('NewBdtForm', () => {
  it("select veloId required avec placeholder", () => {
    const { container } = render(<NewBdtForm velos={VELOS} defaultVeloId={null} />);
    const select = container.querySelector('select[name="veloId"]') as HTMLSelectElement;
    expect(select.required).toBe(true);
    expect(select.options[0]!.value).toBe('');
    expect(select.options[0]!.text).toContain('sélectionner un vélo');
  });

  it('vélos peuplent le select (1 vide + 2 vélos)', () => {
    const { container } = render(<NewBdtForm velos={VELOS} defaultVeloId={null} />);
    const select = container.querySelector('select[name="veloId"]') as HTMLSelectElement;
    expect(select.options.length).toBe(3);
    expect(select.options[1]!.value).toBe('v1');
  });

  it('defaultVeloId pré-sélectionne le vélo', () => {
    const { container } = render(<NewBdtForm velos={VELOS} defaultVeloId="v2" />);
    const select = container.querySelector('select[name="veloId"]') as HTMLSelectElement;
    expect(select.value).toBe('v2');
  });

  it('evalStatus défaut INDECIS avec 5 options', () => {
    const { container } = render(<NewBdtForm velos={VELOS} defaultVeloId={null} />);
    const select = container.querySelector('select[name="evalStatus"]') as HTMLSelectElement;
    expect(select.value).toBe('INDECIS');
    expect(select.options.length).toBe(5);
  });

  it('evalStatus contient les 5 valeurs attendues', () => {
    const { container } = render(<NewBdtForm velos={VELOS} defaultVeloId={null} />);
    const select = container.querySelector('select[name="evalStatus"]') as HTMLSelectElement;
    const values = [...select.options].map((o) => o.value);
    expect(values).toEqual(['INDECIS', 'ATTENTE', 'APPROUVE', 'REDUX', 'REFUSE']);
  });

  it('archiveStatus défaut ACTIF avec 6 options', () => {
    const { container } = render(<NewBdtForm velos={VELOS} defaultVeloId={null} />);
    const select = container.querySelector('select[name="archiveStatus"]') as HTMLSelectElement;
    expect(select.value).toBe('ACTIF');
    expect(select.options.length).toBe(6);
  });

  it('notes textarea rows=4', () => {
    const { container } = render(<NewBdtForm velos={VELOS} defaultVeloId={null} />);
    const textarea = container.querySelector('textarea[name="notes"]') as HTMLTextAreaElement;
    expect(Number(textarea.getAttribute('rows'))).toBe(4);
  });

  it("bouton 'Créer le bon de travail' type=submit", () => {
    render(<NewBdtForm velos={VELOS} defaultVeloId={null} />);
    const btn = screen.getByRole('button', { name: /Créer le bon de travail/ });
    expect(btn.getAttribute('type')).toBe('submit');
  });
});
