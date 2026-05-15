import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('../../bdcs/actions', () => ({
  patchBdtEvalStatusAction: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/lib/utils/toast', () => ({ toast: vi.fn() }));

import { EvalStatusPills } from './eval-status-pills';

describe('EvalStatusPills', () => {
  it("rend les 5 options (Indécis, Attente, Approuvé, Redux, Refusé)", () => {
    render(<EvalStatusPills bdcId="bdc1" initial="INDECIS" />);
    expect(screen.getByText('Indécis')).toBeTruthy();
    expect(screen.getByText('Attente')).toBeTruthy();
    expect(screen.getByText('Approuvé')).toBeTruthy();
    expect(screen.getByText('Redux')).toBeTruthy();
    expect(screen.getByText('Refusé')).toBeTruthy();
  });

  it("option active est désactivée (disabled)", () => {
    render(<EvalStatusPills bdcId="bdc1" initial="APPROUVE" />);
    const btn = screen.getByText('Approuvé').closest('button');
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it("options inactives ne sont pas désactivées", () => {
    render(<EvalStatusPills bdcId="bdc1" initial="APPROUVE" />);
    const btn = screen.getByText('Indécis').closest('button');
    expect((btn as HTMLButtonElement).disabled).toBe(false);
  });

  it("clic sur option inactive appelle patchBdtEvalStatusAction", async () => {
    const { patchBdtEvalStatusAction } = await import('../../bdcs/actions');
    const mock = vi.mocked(patchBdtEvalStatusAction);
    mock.mockResolvedValue({});

    render(<EvalStatusPills bdcId="bdc42" initial="INDECIS" />);
    fireEvent.click(screen.getByText('Attente').closest('button')!);

    await vi.waitFor(() => {
      expect(mock).toHaveBeenCalledWith('bdc42', 'ATTENTE');
    });
  });

  it("clic sur option déjà active ne rappelle pas l'action", async () => {
    const { patchBdtEvalStatusAction } = await import('../../bdcs/actions');
    const mock = vi.mocked(patchBdtEvalStatusAction);
    mock.mockClear();

    render(<EvalStatusPills bdcId="bdc1" initial="INDECIS" />);
    fireEvent.click(screen.getByText('Indécis').closest('button')!);

    await new Promise((r) => setTimeout(r, 50));
    expect(mock).not.toHaveBeenCalled();
  });

  it("erreur renvoyée par l'action → toast appelé", async () => {
    const { patchBdtEvalStatusAction } = await import('../../bdcs/actions');
    vi.mocked(patchBdtEvalStatusAction).mockResolvedValue({ error: 'BDT introuvable' });

    const { toast } = await import('@/lib/utils/toast');
    const toastMock = vi.mocked(toast);

    render(<EvalStatusPills bdcId="bdc1" initial="INDECIS" />);
    fireEvent.click(screen.getByText('Attente').closest('button')!);

    await vi.waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith('BDT introuvable', 'error');
    });
  });
});
