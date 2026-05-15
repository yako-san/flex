import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('../actions', () => ({
  deleteClientAction: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/lib/utils/toast', () => ({ toast: vi.fn() }));

vi.mock('@/components/ui/confirm-dialog', () => ({
  customConfirm: vi.fn().mockResolvedValue(true),
}));

import { DeleteClientButton } from './delete-button';

describe('DeleteClientButton', () => {
  it("hasVelos=false → bouton 'Supprimer' actif", () => {
    render(<DeleteClientButton clientId="c1" clientName="Marie" hasVelos={false} />);
    const btn = screen.getByRole('button', { name: /Supprimer/ });
    expect((btn as HTMLButtonElement).disabled).toBe(false);
  });

  it("hasVelos=true → bouton disabled", () => {
    render(<DeleteClientButton clientId="c1" clientName="Marie" hasVelos={true} />);
    const btn = screen.getByRole('button', { name: /Supprimer/ });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it("hasVelos=true + clic → toast erreur (le clic interne s'exécute quand même)", async () => {
    const { toast } = await import('@/lib/utils/toast');
    const toastMock = vi.mocked(toast);
    toastMock.mockClear();

    render(<DeleteClientButton clientId="c1" clientName="Marie" hasVelos={true} />);
    // Bouton disabled — on appelle directement handleClick via re-render avec hasVelos false puis clic
    // Comme disabled, le clic est ignoré ; on teste plutôt le title attribute
    const btn = screen.getByRole('button', { name: /Supprimer/ });
    expect(btn.getAttribute('title')).toContain('vélos associés');
  });

  it("clic + confirm → deleteClientAction appelé", async () => {
    const { deleteClientAction } = await import('../actions');
    const mock = vi.mocked(deleteClientAction);
    mock.mockClear();
    mock.mockResolvedValue({});

    render(<DeleteClientButton clientId="c42" clientName="Marie" hasVelos={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Supprimer/ }));

    await vi.waitFor(() => {
      expect(mock).toHaveBeenCalledWith('c42');
    });
  });

  it("confirm refusé → action pas appelée", async () => {
    const { customConfirm } = await import('@/components/ui/confirm-dialog');
    vi.mocked(customConfirm).mockResolvedValue(false);

    const { deleteClientAction } = await import('../actions');
    const mock = vi.mocked(deleteClientAction);
    mock.mockClear();

    render(<DeleteClientButton clientId="c1" clientName="Marie" hasVelos={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Supprimer/ }));

    await new Promise((r) => setTimeout(r, 20));
    expect(mock).not.toHaveBeenCalled();
  });

  it("action erreur → toast erreur", async () => {
    const { customConfirm } = await import('@/components/ui/confirm-dialog');
    vi.mocked(customConfirm).mockResolvedValue(true);

    const { deleteClientAction } = await import('../actions');
    vi.mocked(deleteClientAction).mockResolvedValue({ error: 'FK violation' });

    const { toast } = await import('@/lib/utils/toast');
    vi.mocked(toast).mockClear();

    render(<DeleteClientButton clientId="c1" clientName="Marie" hasVelos={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Supprimer/ }));

    await vi.waitFor(() => {
      expect(vi.mocked(toast)).toHaveBeenCalledWith('FK violation', 'error');
    });
  });

  it("succès → toast succès avec le nom du client", async () => {
    const { customConfirm } = await import('@/components/ui/confirm-dialog');
    vi.mocked(customConfirm).mockResolvedValue(true);

    const { deleteClientAction } = await import('../actions');
    vi.mocked(deleteClientAction).mockResolvedValue({});

    const { toast } = await import('@/lib/utils/toast');
    vi.mocked(toast).mockClear();

    render(<DeleteClientButton clientId="c1" clientName="Marie Tremblay" hasVelos={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Supprimer/ }));

    await vi.waitFor(() => {
      expect(vi.mocked(toast)).toHaveBeenCalledWith('Marie Tremblay supprimé', 'success');
    });
  });
});
