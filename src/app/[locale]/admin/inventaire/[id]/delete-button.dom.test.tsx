import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('../actions', () => ({
  deleteBdtAction: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/lib/utils/toast', () => ({ toast: vi.fn() }));

vi.mock('@/components/ui/confirm-dialog', () => ({
  customConfirm: vi.fn().mockResolvedValue(true),
}));

import { DeleteBdtButton } from './delete-button';

describe('DeleteBdtButton', () => {
  it("rend un bouton 'Supprimer'", () => {
    render(<DeleteBdtButton bdcId="b1" />);
    expect(screen.getByRole('button', { name: /Supprimer/ })).toBeTruthy();
  });

  it("confirm refusé → action pas appelée", async () => {
    const { customConfirm } = await import('@/components/ui/confirm-dialog');
    vi.mocked(customConfirm).mockResolvedValue(false);

    const { deleteBdtAction } = await import('../actions');
    const mock = vi.mocked(deleteBdtAction);
    mock.mockClear();

    render(<DeleteBdtButton bdcId="b1" />);
    fireEvent.click(screen.getByRole('button'));
    await new Promise((r) => setTimeout(r, 20));
    expect(mock).not.toHaveBeenCalled();
  });

  it("confirm accepté → deleteBdtAction appelé", async () => {
    const { customConfirm } = await import('@/components/ui/confirm-dialog');
    vi.mocked(customConfirm).mockResolvedValue(true);

    const { deleteBdtAction } = await import('../actions');
    const mock = vi.mocked(deleteBdtAction);
    mock.mockClear();
    mock.mockResolvedValue({});

    render(<DeleteBdtButton bdcId="b42" />);
    fireEvent.click(screen.getByRole('button'));

    await vi.waitFor(() => {
      expect(mock).toHaveBeenCalledWith('b42');
    });
  });

  it("succès → toast 'BDT supprimé'", async () => {
    const { customConfirm } = await import('@/components/ui/confirm-dialog');
    vi.mocked(customConfirm).mockResolvedValue(true);

    const { deleteBdtAction } = await import('../actions');
    vi.mocked(deleteBdtAction).mockResolvedValue({});

    const { toast } = await import('@/lib/utils/toast');
    vi.mocked(toast).mockClear();

    render(<DeleteBdtButton bdcId="b1" />);
    fireEvent.click(screen.getByRole('button'));

    await vi.waitFor(() => {
      expect(vi.mocked(toast)).toHaveBeenCalledWith('BDT supprimé', 'success');
    });
  });

  it("erreur action → toast erreur", async () => {
    const { customConfirm } = await import('@/components/ui/confirm-dialog');
    vi.mocked(customConfirm).mockResolvedValue(true);

    const { deleteBdtAction } = await import('../actions');
    vi.mocked(deleteBdtAction).mockResolvedValue({ error: 'BDT introuvable' });

    const { toast } = await import('@/lib/utils/toast');
    vi.mocked(toast).mockClear();

    render(<DeleteBdtButton bdcId="b1" />);
    fireEvent.click(screen.getByRole('button'));

    await vi.waitFor(() => {
      expect(vi.mocked(toast)).toHaveBeenCalledWith('BDT introuvable', 'error');
    });
  });
});
