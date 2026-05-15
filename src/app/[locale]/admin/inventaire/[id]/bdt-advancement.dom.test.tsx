import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('../../bdcs/actions', () => ({
  patchBdtCheckboxAction: vi.fn().mockResolvedValue({}),
  patchBdtEvalStatusAction: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/lib/utils/toast', () => ({ toast: vi.fn() }));

import { BdtAdvancement } from './bdt-advancement';

const BASE = {
  cbEvalEnvoye: false,
  cbEval: false,
  cbBonSortie: false,
  cbArchiver: false,
};

describe('BdtAdvancement', () => {
  it("rend les 4 labels d'avancement", () => {
    render(<BdtAdvancement bdcId="b1" initialCheckboxes={BASE} initialEvalStatus="INDECIS" />);
    expect(screen.getByText('Évaluation envoyée')).toBeTruthy();
    expect(screen.getByText('Éval. validée')).toBeTruthy();
    expect(screen.getByText('Bon de sortie')).toBeTruthy();
    expect(screen.getByText('Archiver')).toBeTruthy();
  });

  it("cbEval non coché → pas de pills statut éval visibles", () => {
    render(<BdtAdvancement bdcId="b1" initialCheckboxes={BASE} initialEvalStatus="INDECIS" />);
    expect(screen.queryByText('Approuvé')).toBeNull();
    expect(screen.queryByText('Refusé')).toBeNull();
  });

  it("cbEval coché → 5 pills statut éval visibles", () => {
    render(
      <BdtAdvancement
        bdcId="b1"
        initialCheckboxes={{ ...BASE, cbEval: true }}
        initialEvalStatus="ATTENTE"
      />,
    );
    expect(screen.getByText('Indécis')).toBeTruthy();
    expect(screen.getByText('Attente')).toBeTruthy();
    expect(screen.getByText('Approuvé')).toBeTruthy();
    expect(screen.getByText('Redux')).toBeTruthy();
    expect(screen.getByText('Refusé')).toBeTruthy();
  });

  it("clic sur checkbox → patchBdtCheckboxAction appelé", async () => {
    const { patchBdtCheckboxAction } = await import('../../bdcs/actions');
    const mock = vi.mocked(patchBdtCheckboxAction);
    mock.mockClear();
    mock.mockResolvedValue({});

    render(<BdtAdvancement bdcId="b42" initialCheckboxes={BASE} initialEvalStatus="INDECIS" />);
    fireEvent.click(screen.getByText('Évaluation envoyée').closest('button')!);

    await vi.waitFor(() => {
      expect(mock).toHaveBeenCalledWith('b42', 'cbEvalEnvoye', true);
    });
  });

  it("clic sur pill éval inactive → patchBdtEvalStatusAction appelé", async () => {
    const { patchBdtEvalStatusAction } = await import('../../bdcs/actions');
    const mock = vi.mocked(patchBdtEvalStatusAction);
    mock.mockClear();
    mock.mockResolvedValue({});

    render(
      <BdtAdvancement
        bdcId="b1"
        initialCheckboxes={{ ...BASE, cbEval: true }}
        initialEvalStatus="INDECIS"
      />,
    );
    fireEvent.click(screen.getByText('Approuvé').closest('button')!);

    await vi.waitFor(() => {
      expect(mock).toHaveBeenCalledWith('b1', 'APPROUVE');
    });
  });

  it("pill éval active est disabled", () => {
    render(
      <BdtAdvancement
        bdcId="b1"
        initialCheckboxes={{ ...BASE, cbEval: true }}
        initialEvalStatus="APPROUVE"
      />,
    );
    const btn = screen.getByText('Approuvé').closest('button')!;
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it("erreur checkbox → toast", async () => {
    const { patchBdtCheckboxAction } = await import('../../bdcs/actions');
    vi.mocked(patchBdtCheckboxAction).mockResolvedValue({ error: 'BDT introuvable' });

    const { toast } = await import('@/lib/utils/toast');

    render(<BdtAdvancement bdcId="b1" initialCheckboxes={BASE} initialEvalStatus="INDECIS" />);
    fireEvent.click(screen.getByText('Archiver').closest('button')!);

    await vi.waitFor(() => {
      expect(vi.mocked(toast)).toHaveBeenCalledWith('BDT introuvable', 'error');
    });
  });
});
