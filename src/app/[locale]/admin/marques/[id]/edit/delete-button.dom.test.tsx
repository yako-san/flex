import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('../../actions', () => ({
  deleteMarqueAction: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/lib/utils/toast', () => ({ toast: vi.fn() }));

vi.mock('@/components/ui/confirm-dialog', () => ({
  customConfirm: vi.fn().mockResolvedValue(true),
}));

import { DeleteMarqueButton } from './delete-button';

describe('DeleteMarqueButton', () => {
  it("hasVelos=false → bouton actif", () => {
    render(<DeleteMarqueButton marqueId="m1" marqueName="Trek" hasVelos={false} />);
    const btn = screen.getByRole('button', { name: /Supprimer/ });
    expect((btn as HTMLButtonElement).disabled).toBe(false);
  });

  it("hasVelos=true → bouton disabled + title", () => {
    render(<DeleteMarqueButton marqueId="m1" marqueName="Trek" hasVelos={true} />);
    const btn = screen.getByRole('button', { name: /Supprimer/ });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
    expect(btn.getAttribute('title')).toContain('vélos associés');
  });

  it("succès → toast accord féminin 'supprimée'", async () => {
    const { customConfirm } = await import('@/components/ui/confirm-dialog');
    vi.mocked(customConfirm).mockResolvedValue(true);

    const { deleteMarqueAction } = await import('../../actions');
    vi.mocked(deleteMarqueAction).mockResolvedValue({});

    const { toast } = await import('@/lib/utils/toast');
    vi.mocked(toast).mockClear();

    render(<DeleteMarqueButton marqueId="m1" marqueName="Trek" hasVelos={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Supprimer/ }));

    await vi.waitFor(() => {
      expect(vi.mocked(toast)).toHaveBeenCalledWith('Trek supprimée', 'success');
    });
  });

  it("erreur action → toast erreur", async () => {
    const { customConfirm } = await import('@/components/ui/confirm-dialog');
    vi.mocked(customConfirm).mockResolvedValue(true);

    const { deleteMarqueAction } = await import('../../actions');
    vi.mocked(deleteMarqueAction).mockResolvedValue({ error: 'Erreur' });

    const { toast } = await import('@/lib/utils/toast');
    vi.mocked(toast).mockClear();

    render(<DeleteMarqueButton marqueId="m1" marqueName="Trek" hasVelos={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Supprimer/ }));

    await vi.waitFor(() => {
      expect(vi.mocked(toast)).toHaveBeenCalledWith('Erreur', 'error');
    });
  });
});
