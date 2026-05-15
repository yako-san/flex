import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('../../bdcs/actions', () => ({
  patchBdtCheckboxAction: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/lib/utils/toast', () => ({ toast: vi.fn() }));

import { WorkflowQuickToggles } from './workflow-quick-toggle';

const BASE_WORKFLOW = {
  cbEvalEnvoye: false,
  cbEval: false,
  cbBonSortie: false,
  cbArchiver: false,
};

describe('WorkflowQuickToggles', () => {
  it("rend les 4 labels de workflow", () => {
    render(<WorkflowQuickToggles bdcId="bdc1" initial={BASE_WORKFLOW} />);
    expect(screen.getByText('Évaluation envoyée')).toBeTruthy();
    expect(screen.getByText('Éval. validée')).toBeTruthy();
    expect(screen.getByText('Bon de sortie')).toBeTruthy();
    expect(screen.getByText('Archiver')).toBeTruthy();
  });

  it("items non cochés → 4 boutons non désactivés", () => {
    render(<WorkflowQuickToggles bdcId="bdc1" initial={BASE_WORKFLOW} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
    buttons.forEach((b) => expect((b as HTMLButtonElement).disabled).toBe(false));
  });

  it("items cochés → texte en font-semibold (classe CSS)", () => {
    render(
      <WorkflowQuickToggles
        bdcId="bdc1"
        initial={{ ...BASE_WORKFLOW, cbEvalEnvoye: true }}
      />,
    );
    const label = screen.getByText('Évaluation envoyée');
    expect(label.className).toContain('font-semibold');
  });

  it("clic sur un item → patchBdtCheckboxAction appelé", async () => {
    const { patchBdtCheckboxAction } = await import('../../bdcs/actions');
    const mock = vi.mocked(patchBdtCheckboxAction);
    mock.mockResolvedValue({});

    render(<WorkflowQuickToggles bdcId="bdc99" initial={BASE_WORKFLOW} />);
    fireEvent.click(screen.getByText('Éval. validée').closest('button')!);

    await vi.waitFor(() => {
      expect(mock).toHaveBeenCalledWith('bdc99', 'cbEval', true);
    });
  });

  it("item coché → clic → appelle avec false", async () => {
    const { patchBdtCheckboxAction } = await import('../../bdcs/actions');
    const mock = vi.mocked(patchBdtCheckboxAction);
    mock.mockResolvedValue({});

    render(
      <WorkflowQuickToggles
        bdcId="bdc1"
        initial={{ ...BASE_WORKFLOW, cbBonSortie: true }}
      />,
    );
    fireEvent.click(screen.getByText('Bon de sortie').closest('button')!);

    await vi.waitFor(() => {
      expect(mock).toHaveBeenCalledWith('bdc1', 'cbBonSortie', false);
    });
  });

  it("erreur serveur → toast error", async () => {
    const { patchBdtCheckboxAction } = await import('../../bdcs/actions');
    vi.mocked(patchBdtCheckboxAction).mockResolvedValue({ error: 'Erreur' });

    const { toast } = await import('@/lib/utils/toast');

    render(<WorkflowQuickToggles bdcId="bdc1" initial={BASE_WORKFLOW} />);
    fireEvent.click(screen.getByText('Archiver').closest('button')!);

    await vi.waitFor(() => {
      expect(vi.mocked(toast)).toHaveBeenCalledWith('Erreur', 'error');
    });
  });
});
