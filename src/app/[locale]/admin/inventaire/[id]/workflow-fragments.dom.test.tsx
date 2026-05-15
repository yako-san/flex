import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('../../bdcs/actions', () => ({
  patchBdcRemisesAction: vi.fn().mockResolvedValue(null),
  patchBdcAvanceAction: vi.fn().mockResolvedValue(null),
  patchBdcNotesAction: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/utils/toast', () => ({ toast: vi.fn() }));

import {
  RemisesFragment,
  AvanceFragment,
  NotesFragment,
} from './workflow-fragments';

const BDC_BASE = {
  id: 'bdc1',
  workshopId: 'w1',
};

const BDC_REMISES = {
  ...BDC_BASE,
  remiseSvcType: null,
  remiseSvcValue: null,
  remisePceType: null,
  remisePceValue: null,
};

const BDC_AVANCE = {
  ...BDC_BASE,
  avanceMontant: null,
  avanceMode: null,
  avanceNote: null,
};

const BDC_NOTES = {
  ...BDC_BASE,
  noteClientEval: null,
  noteClientFacture: null,
  notes: null,
};

describe('RemisesFragment', () => {
  it("rend le badge 'Remises'", () => {
    render(<RemisesFragment bdc={BDC_REMISES as any} />);
    expect(screen.getByText('Remises')).toBeTruthy();
  });

  it("bdcId hidden présent", () => {
    const { container } = render(<RemisesFragment bdc={BDC_REMISES as any} />);
    const hidden = container.querySelector('input[name="bdcId"]') as HTMLInputElement;
    expect(hidden.type).toBe('hidden');
    expect(hidden.value).toBe('bdc1');
  });

  it("selects remiseSvcType et remisePceType avec options % et $", () => {
    const { container } = render(<RemisesFragment bdc={BDC_REMISES as any} />);
    const selects = container.querySelectorAll('select[name="remiseSvcType"], select[name="remisePceType"]');
    expect(selects.length).toBe(2);
    const svcSelect = selects[0] as HTMLSelectElement;
    const values = [...svcSelect.options].map((o) => o.value);
    expect(values).toEqual(['', 'PCT', 'FIXED']);
  });

  it("inputs remiseSvcValue et remisePceValue type=number", () => {
    const { container } = render(<RemisesFragment bdc={BDC_REMISES as any} />);
    const inputs = container.querySelectorAll('input[name="remiseSvcValue"], input[name="remisePceValue"]');
    expect(inputs.length).toBe(2);
  });
});

describe('AvanceFragment', () => {
  it("rend le badge 'Avance / acompte client'", () => {
    render(<AvanceFragment bdc={BDC_AVANCE as any} />);
    expect(screen.getByText(/Avance/)).toBeTruthy();
  });

  it("bdcId hidden présent", () => {
    const { container } = render(<AvanceFragment bdc={BDC_AVANCE as any} />);
    const hidden = container.querySelector('input[name="bdcId"]') as HTMLInputElement;
    expect(hidden.value).toBe('bdc1');
  });

  it("avanceMontant type=number, step=0.01", () => {
    const { container } = render(<AvanceFragment bdc={BDC_AVANCE as any} />);
    const input = container.querySelector('input[name="avanceMontant"]') as HTMLInputElement;
    expect(input.type).toBe('number');
    expect(input.step).toBe('0.01');
  });

  it("select avanceMode avec 3 options + vide", () => {
    const { container } = render(<AvanceFragment bdc={BDC_AVANCE as any} />);
    const select = container.querySelector('select[name="avanceMode"]') as HTMLSelectElement;
    expect(select.options.length).toBe(4);
    const values = [...select.options].map((o) => o.value);
    expect(values).toContain('COMPTANT');
    expect(values).toContain('INTERAC');
    expect(values).toContain('CARTES');
  });
});

describe('NotesFragment', () => {
  it("rend le badge 'Notes'", () => {
    render(<NotesFragment bdc={BDC_NOTES as any} />);
    expect(screen.getByText('Notes')).toBeTruthy();
  });

  it("noteClientEval textarea rows=3", () => {
    const { container } = render(<NotesFragment bdc={BDC_NOTES as any} />);
    const ta = container.querySelector('textarea[name="noteClientEval"]') as HTMLTextAreaElement;
    expect(Number(ta.getAttribute('rows'))).toBe(3);
  });

  it("noteClientFacture textarea rows=3", () => {
    const { container } = render(<NotesFragment bdc={BDC_NOTES as any} />);
    const ta = container.querySelector('textarea[name="noteClientFacture"]') as HTMLTextAreaElement;
    expect(Number(ta.getAttribute('rows'))).toBe(3);
  });

  it("notes textarea rows=4", () => {
    const { container } = render(<NotesFragment bdc={BDC_NOTES as any} />);
    const ta = container.querySelector('textarea[name="notes"]') as HTMLTextAreaElement;
    expect(Number(ta.getAttribute('rows'))).toBe(4);
  });

  it("bdcId hidden présent", () => {
    const { container } = render(<NotesFragment bdc={BDC_NOTES as any} />);
    const hidden = container.querySelector('input[name="bdcId"]') as HTMLInputElement;
    expect(hidden.value).toBe('bdc1');
  });
});
