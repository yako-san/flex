import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('../actions', () => ({
  removeBdtItemAction: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/lib/utils/toast', () => ({ toast: vi.fn() }));

vi.mock('@/components/ui/confirm-dialog', () => ({
  customConfirm: vi.fn().mockResolvedValue(true),
}));

import { RemoveItemButton } from './remove-item-button';

describe('RemoveItemButton', () => {
  it("rend un bouton avec aria-label", () => {
    render(<RemoveItemButton itemId="i1" />);
    const btn = screen.getByRole('button', { name: /Supprimer l'item du BDT/ });
    expect(btn).toBeTruthy();
  });

  it("clic + confirm refusé → action pas appelée", async () => {
    const { customConfirm } = await import('@/components/ui/confirm-dialog');
    vi.mocked(customConfirm).mockResolvedValue(false);

    const { removeBdtItemAction } = await import('../actions');
    const mock = vi.mocked(removeBdtItemAction);
    mock.mockClear();

    render(<RemoveItemButton itemId="i1" />);
    fireEvent.click(screen.getByRole('button'));

    await new Promise((r) => setTimeout(r, 20));
    expect(mock).not.toHaveBeenCalled();
  });

  it("clic + confirm accepté → removeBdtItemAction appelé avec itemId", async () => {
    const { customConfirm } = await import('@/components/ui/confirm-dialog');
    vi.mocked(customConfirm).mockResolvedValue(true);

    const { removeBdtItemAction } = await import('../actions');
    const mock = vi.mocked(removeBdtItemAction);
    mock.mockClear();
    mock.mockResolvedValue({});

    render(<RemoveItemButton itemId="i99" />);
    fireEvent.click(screen.getByRole('button'));

    await vi.waitFor(() => {
      expect(mock).toHaveBeenCalledWith('i99');
    });
  });

  it("erreur action → toast erreur", async () => {
    const { customConfirm } = await import('@/components/ui/confirm-dialog');
    vi.mocked(customConfirm).mockResolvedValue(true);

    const { removeBdtItemAction } = await import('../actions');
    vi.mocked(removeBdtItemAction).mockResolvedValue({ error: 'Item introuvable' });

    const { toast } = await import('@/lib/utils/toast');
    vi.mocked(toast).mockClear();

    render(<RemoveItemButton itemId="i1" />);
    fireEvent.click(screen.getByRole('button'));

    await vi.waitFor(() => {
      expect(vi.mocked(toast)).toHaveBeenCalledWith('Item introuvable', 'error');
    });
  });

  it("title attribute pour accessibilité", () => {
    render(<RemoveItemButton itemId="i1" />);
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('title')).toBe("Supprimer l'item");
  });
});
