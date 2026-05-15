import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('../actions', () => ({
  deleteVeloAction: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/lib/utils/toast', () => ({ toast: vi.fn() }));

vi.mock('@/components/ui/confirm-dialog', () => ({
  customConfirm: vi.fn().mockResolvedValue(true),
}));

import { DeleteVeloButton } from './delete-button';

describe('DeleteVeloButton', () => {
  it("hasBdcs=false → bouton 'Supprimer' actif", () => {
    render(<DeleteVeloButton veloId="v1" veloLabel="Trek 7300" hasBdcs={false} />);
    const btn = screen.getByRole('button', { name: /Supprimer/ });
    expect((btn as HTMLButtonElement).disabled).toBe(false);
  });

  it("hasBdcs=true → bouton disabled + title approprié", () => {
    render(<DeleteVeloButton veloId="v1" veloLabel="Trek" hasBdcs={true} />);
    const btn = screen.getByRole('button', { name: /Supprimer/ });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
    expect(btn.getAttribute('title')).toContain('BDT associés');
  });

  it("clic + confirm → deleteVeloAction appelé avec veloId", async () => {
    const { customConfirm } = await import('@/components/ui/confirm-dialog');
    vi.mocked(customConfirm).mockResolvedValue(true);

    const { deleteVeloAction } = await import('../actions');
    const mock = vi.mocked(deleteVeloAction);
    mock.mockClear();
    mock.mockResolvedValue({});

    render(<DeleteVeloButton veloId="v99" veloLabel="Trek" hasBdcs={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Supprimer/ }));

    await vi.waitFor(() => {
      expect(mock).toHaveBeenCalledWith('v99');
    });
  });

  it("succès → toast succès avec veloLabel", async () => {
    const { customConfirm } = await import('@/components/ui/confirm-dialog');
    vi.mocked(customConfirm).mockResolvedValue(true);

    const { deleteVeloAction } = await import('../actions');
    vi.mocked(deleteVeloAction).mockResolvedValue({});

    const { toast } = await import('@/lib/utils/toast');
    vi.mocked(toast).mockClear();

    render(<DeleteVeloButton veloId="v1" veloLabel="Trek 7300" hasBdcs={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Supprimer/ }));

    await vi.waitFor(() => {
      expect(vi.mocked(toast)).toHaveBeenCalledWith('Trek 7300 supprimé', 'success');
    });
  });

  it("erreur → toast erreur", async () => {
    const { customConfirm } = await import('@/components/ui/confirm-dialog');
    vi.mocked(customConfirm).mockResolvedValue(true);

    const { deleteVeloAction } = await import('../actions');
    vi.mocked(deleteVeloAction).mockResolvedValue({ error: 'Erreur' });

    const { toast } = await import('@/lib/utils/toast');
    vi.mocked(toast).mockClear();

    render(<DeleteVeloButton veloId="v1" veloLabel="Trek" hasBdcs={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Supprimer/ }));

    await vi.waitFor(() => {
      expect(vi.mocked(toast)).toHaveBeenCalledWith('Erreur', 'error');
    });
  });
});
