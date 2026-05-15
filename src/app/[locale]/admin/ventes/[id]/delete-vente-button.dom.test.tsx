import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('../actions', () => ({
  deleteVenteAction: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/lib/utils/toast', () => ({ toast: vi.fn() }));

vi.mock('@/components/ui/confirm-dialog', () => ({
  customConfirm: vi.fn().mockResolvedValue(true),
}));

import { DeleteVenteButton } from './delete-vente-button';

describe('DeleteVenteButton', () => {
  it("rend un bouton 'Supprimer'", () => {
    render(<DeleteVenteButton venteId="v1" />);
    expect(screen.getByRole('button', { name: /Supprimer/ })).toBeTruthy();
  });

  it("clic + accept → deleteVenteAction('v42')", async () => {
    const { customConfirm } = await import('@/components/ui/confirm-dialog');
    vi.mocked(customConfirm).mockResolvedValue(true);

    const { deleteVenteAction } = await import('../actions');
    vi.mocked(deleteVenteAction).mockClear();
    vi.mocked(deleteVenteAction).mockResolvedValue({});

    render(<DeleteVenteButton venteId="v42" />);
    fireEvent.click(screen.getByRole('button'));

    await vi.waitFor(() => {
      expect(vi.mocked(deleteVenteAction)).toHaveBeenCalledWith('v42');
    });
  });

  it("succès → toast 'Vente supprimée'", async () => {
    const { customConfirm } = await import('@/components/ui/confirm-dialog');
    vi.mocked(customConfirm).mockResolvedValue(true);

    const { deleteVenteAction } = await import('../actions');
    vi.mocked(deleteVenteAction).mockResolvedValue({});

    const { toast } = await import('@/lib/utils/toast');
    vi.mocked(toast).mockClear();

    render(<DeleteVenteButton venteId="v1" />);
    fireEvent.click(screen.getByRole('button'));

    await vi.waitFor(() => {
      expect(vi.mocked(toast)).toHaveBeenCalledWith('Vente supprimée', 'success');
    });
  });

  it("confirm refusé → action pas appelée", async () => {
    const { customConfirm } = await import('@/components/ui/confirm-dialog');
    vi.mocked(customConfirm).mockResolvedValue(false);

    const { deleteVenteAction } = await import('../actions');
    vi.mocked(deleteVenteAction).mockClear();

    render(<DeleteVenteButton venteId="v1" />);
    fireEvent.click(screen.getByRole('button'));

    await new Promise((r) => setTimeout(r, 20));
    expect(vi.mocked(deleteVenteAction)).not.toHaveBeenCalled();
  });

  it("erreur → toast erreur", async () => {
    const { customConfirm } = await import('@/components/ui/confirm-dialog');
    vi.mocked(customConfirm).mockResolvedValue(true);

    const { deleteVenteAction } = await import('../actions');
    vi.mocked(deleteVenteAction).mockResolvedValue({ error: 'Vente déjà facturée' });

    const { toast } = await import('@/lib/utils/toast');
    vi.mocked(toast).mockClear();

    render(<DeleteVenteButton venteId="v1" />);
    fireEvent.click(screen.getByRole('button'));

    await vi.waitFor(() => {
      expect(vi.mocked(toast)).toHaveBeenCalledWith('Vente déjà facturée', 'error');
    });
  });
});
