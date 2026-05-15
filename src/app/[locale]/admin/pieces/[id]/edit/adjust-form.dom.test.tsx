import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('../../actions', () => ({
  adjustStockAction: vi.fn().mockResolvedValue(null),
}));

import { AdjustStockForm } from './adjust-form';

describe('AdjustStockForm', () => {
  it("input pieceId hidden avec valeur correcte", () => {
    const { container } = render(<AdjustStockForm pieceId="p42" currentStock={10} />);
    const hidden = container.querySelector('input[name="pieceId"]') as HTMLInputElement;
    expect(hidden.type).toBe('hidden');
    expect(hidden.value).toBe('p42');
  });

  it('delta type=number, step=1, required', () => {
    const { container } = render(<AdjustStockForm pieceId="p1" currentStock={5} />);
    const delta = container.querySelector('input[name="delta"]') as HTMLInputElement;
    expect(delta.type).toBe('number');
    expect(delta.step).toBe('1');
    expect(delta.required).toBe(true);
  });

  it('reason required', () => {
    const { container } = render(<AdjustStockForm pieceId="p1" currentStock={5} />);
    const reason = container.querySelector('input[name="reason"]') as HTMLInputElement;
    expect(reason.required).toBe(true);
  });

  it("bouton 'Ajuster' type=submit, non disabled par défaut", () => {
    render(<AdjustStockForm pieceId="p1" currentStock={5} />);
    const btn = screen.getByRole('button', { name: /Ajuster/ }) as HTMLButtonElement;
    expect(btn.getAttribute('type')).toBe('submit');
    expect(btn.disabled).toBe(false);
  });

  it('au mount, pas de message erreur ni succès', () => {
    render(<AdjustStockForm pieceId="p1" currentStock={5} />);
    expect(screen.queryByText(/✓/)).toBeNull();
  });

  it('aperçu nouveau stock affiché quand delta non nul', () => {
    const { container } = render(<AdjustStockForm pieceId="p1" currentStock={10} />);
    const delta = container.querySelector('input[name="delta"]') as HTMLInputElement;
    fireEvent.change(delta, { target: { value: '3' } });
    expect(screen.getByText(/Nouveau stock/)).toBeTruthy();
    expect(screen.getByText('13')).toBeTruthy();
  });

  it('placeholder delta contient +5', () => {
    const { container } = render(<AdjustStockForm pieceId="p1" currentStock={5} />);
    const delta = container.querySelector('input[name="delta"]') as HTMLInputElement;
    expect(delta.placeholder).toContain('+5');
  });
});
