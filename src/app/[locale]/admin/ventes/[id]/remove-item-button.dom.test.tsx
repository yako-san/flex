import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('../actions', () => ({
  removeVenteItemAction: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/lib/utils/toast', () => ({ toast: vi.fn() }));

vi.mock('@/components/ui/confirm-dialog', () => ({
  customConfirm: vi.fn().mockResolvedValue(true),
}));

import { RemoveItemButton } from './remove-item-button';

describe('RemoveItemButton (ventes)', () => {
  it("rend un bouton avec aria-label vente", () => {
    render(<RemoveItemButton itemId="vi1" />);
    expect(screen.getByRole('button', { name: /Retirer l'item de la vente/ })).toBeTruthy();
  });

  it("clic + confirm refusé → action pas appelée", async () => {
    const { customConfirm } = await import('@/components/ui/confirm-dialog');
    vi.mocked(customConfirm).mockResolvedValue(false);

    const { removeVenteItemAction } = await import('../actions');
    vi.mocked(removeVenteItemAction).mockClear();

    render(<RemoveItemButton itemId="vi1" />);
    fireEvent.click(screen.getByRole('button'));

    await new Promise((r) => setTimeout(r, 20));
    expect(vi.mocked(removeVenteItemAction)).not.toHaveBeenCalled();
  });

  it("clic + confirm accept → removeVenteItemAction(itemId)", async () => {
    const { customConfirm } = await import('@/components/ui/confirm-dialog');
    vi.mocked(customConfirm).mockResolvedValue(true);

    const { removeVenteItemAction } = await import('../actions');
    vi.mocked(removeVenteItemAction).mockClear();
    vi.mocked(removeVenteItemAction).mockResolvedValue({});

    render(<RemoveItemButton itemId="vi99" />);
    fireEvent.click(screen.getByRole('button'));

    await vi.waitFor(() => {
      expect(vi.mocked(removeVenteItemAction)).toHaveBeenCalledWith('vi99');
    });
  });

  it("erreur → toast erreur", async () => {
    const { customConfirm } = await import('@/components/ui/confirm-dialog');
    vi.mocked(customConfirm).mockResolvedValue(true);

    const { removeVenteItemAction } = await import('../actions');
    vi.mocked(removeVenteItemAction).mockResolvedValue({ error: 'Item introuvable' });

    const { toast } = await import('@/lib/utils/toast');
    vi.mocked(toast).mockClear();

    render(<RemoveItemButton itemId="vi1" />);
    fireEvent.click(screen.getByRole('button'));

    await vi.waitFor(() => {
      expect(vi.mocked(toast)).toHaveBeenCalledWith('Item introuvable', 'error');
    });
  });

  it("title 'Retirer l'item'", () => {
    render(<RemoveItemButton itemId="vi1" />);
    expect(screen.getByRole('button').getAttribute('title')).toBe("Retirer l'item");
  });
});
