import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('../actions', () => ({
  emitVenteFactureAction: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/lib/utils/toast', () => ({ toast: vi.fn() }));

vi.mock('@/components/ui/confirm-dialog', () => ({
  customConfirm: vi.fn().mockResolvedValue(true),
}));

import { EmitFactureButton } from './emit-facture-button';

describe('EmitFactureButton', () => {
  it("rend un select (4 modes) + bouton Émettre", () => {
    render(<EmitFactureButton venteId="v1" disabled={false} />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select).toBeTruthy();
    expect(screen.getByRole('button', { name: /Émettre/ })).toBeTruthy();
    expect(screen.getByText('Comptant')).toBeTruthy();
    expect(screen.getByText('Interac')).toBeTruthy();
    expect(screen.getByText('Carte')).toBeTruthy();
    expect(screen.getByText('Autre')).toBeTruthy();
  });

  it("mode par défaut = COMPTANT", () => {
    render(<EmitFactureButton venteId="v1" disabled={false} />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('COMPTANT');
  });

  it("disabled prop désactive bouton et select", () => {
    render(<EmitFactureButton venteId="v1" disabled={true} />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    const btn = screen.getByRole('button', { name: /Émettre/ });
    expect(select.disabled).toBe(true);
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it("changement de mode → select reflète", () => {
    render(<EmitFactureButton venteId="v1" disabled={false} />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'INTERAC' } });
    expect(select.value).toBe('INTERAC');
  });

  it("clic Émettre + confirm → emitVenteFactureAction(venteId, mode)", async () => {
    const { customConfirm } = await import('@/components/ui/confirm-dialog');
    vi.mocked(customConfirm).mockResolvedValue(true);

    const { emitVenteFactureAction } = await import('../actions');
    vi.mocked(emitVenteFactureAction).mockClear();
    vi.mocked(emitVenteFactureAction).mockResolvedValue({});

    render(<EmitFactureButton venteId="v42" disabled={false} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'CARTE' } });
    fireEvent.click(screen.getByRole('button', { name: /Émettre/ }));

    await vi.waitFor(() => {
      expect(vi.mocked(emitVenteFactureAction)).toHaveBeenCalledWith('v42', 'CARTE');
    });
  });

  it("succès → toast 'Facture émise'", async () => {
    const { customConfirm } = await import('@/components/ui/confirm-dialog');
    vi.mocked(customConfirm).mockResolvedValue(true);

    const { emitVenteFactureAction } = await import('../actions');
    vi.mocked(emitVenteFactureAction).mockResolvedValue({});

    const { toast } = await import('@/lib/utils/toast');
    vi.mocked(toast).mockClear();

    render(<EmitFactureButton venteId="v1" disabled={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Émettre/ }));

    await vi.waitFor(() => {
      expect(vi.mocked(toast)).toHaveBeenCalledWith('Facture émise', 'success');
    });
  });

  it("erreur → toast erreur", async () => {
    const { customConfirm } = await import('@/components/ui/confirm-dialog');
    vi.mocked(customConfirm).mockResolvedValue(true);

    const { emitVenteFactureAction } = await import('../actions');
    vi.mocked(emitVenteFactureAction).mockResolvedValue({ error: 'Stock insuffisant' });

    const { toast } = await import('@/lib/utils/toast');
    vi.mocked(toast).mockClear();

    render(<EmitFactureButton venteId="v1" disabled={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Émettre/ }));

    await vi.waitFor(() => {
      expect(vi.mocked(toast)).toHaveBeenCalledWith('Stock insuffisant', 'error');
    });
  });
});
