import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('../actions', () => ({
  receivePoAction: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/lib/utils/toast', () => ({ toast: vi.fn() }));

vi.mock('@/components/ui/confirm-dialog', () => ({
  customConfirm: vi.fn().mockResolvedValue(true),
}));

import { ReceivePoButton } from './receive-button';

describe('ReceivePoButton', () => {
  it("rend un bouton 'Marquer reçu'", () => {
    render(<ReceivePoButton poId="po1" poNumero="PO-001" />);
    expect(screen.getByRole('button', { name: /Marquer reçu/ })).toBeTruthy();
  });

  it("clic + accept → receivePoAction(poId)", async () => {
    const { customConfirm } = await import('@/components/ui/confirm-dialog');
    vi.mocked(customConfirm).mockResolvedValue(true);

    const { receivePoAction } = await import('../actions');
    vi.mocked(receivePoAction).mockClear();
    vi.mocked(receivePoAction).mockResolvedValue({});

    render(<ReceivePoButton poId="po42" poNumero="PO-042" />);
    fireEvent.click(screen.getByRole('button'));

    await vi.waitFor(() => {
      expect(vi.mocked(receivePoAction)).toHaveBeenCalledWith('po42');
    });
  });

  it("succès → toast avec poNumero", async () => {
    const { customConfirm } = await import('@/components/ui/confirm-dialog');
    vi.mocked(customConfirm).mockResolvedValue(true);

    const { receivePoAction } = await import('../actions');
    vi.mocked(receivePoAction).mockResolvedValue({});

    const { toast } = await import('@/lib/utils/toast');
    vi.mocked(toast).mockClear();

    render(<ReceivePoButton poId="po1" poNumero="PO-123" />);
    fireEvent.click(screen.getByRole('button'));

    await vi.waitFor(() => {
      expect(vi.mocked(toast)).toHaveBeenCalledWith('PO-123 marqué reçu', 'success');
    });
  });

  it("confirm refusé → action pas appelée", async () => {
    const { customConfirm } = await import('@/components/ui/confirm-dialog');
    vi.mocked(customConfirm).mockResolvedValue(false);

    const { receivePoAction } = await import('../actions');
    vi.mocked(receivePoAction).mockClear();

    render(<ReceivePoButton poId="po1" poNumero="PO-001" />);
    fireEvent.click(screen.getByRole('button'));

    await new Promise((r) => setTimeout(r, 20));
    expect(vi.mocked(receivePoAction)).not.toHaveBeenCalled();
  });

  it("erreur → toast erreur", async () => {
    const { customConfirm } = await import('@/components/ui/confirm-dialog');
    vi.mocked(customConfirm).mockResolvedValue(true);

    const { receivePoAction } = await import('../actions');
    vi.mocked(receivePoAction).mockResolvedValue({ error: 'PO déjà reçu' });

    const { toast } = await import('@/lib/utils/toast');
    vi.mocked(toast).mockClear();

    render(<ReceivePoButton poId="po1" poNumero="PO-001" />);
    fireEvent.click(screen.getByRole('button'));

    await vi.waitFor(() => {
      expect(vi.mocked(toast)).toHaveBeenCalledWith('PO déjà reçu', 'error');
    });
  });
});
