import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

import { UiKitCheckboxes } from './checkbox-demo';

describe('UiKitCheckboxes', () => {
  it("rend 3 labels de checkboxes + 1 disabled", () => {
    render(<UiKitCheckboxes />);
    expect(screen.getByLabelText('Évaluation envoyée')).toBeTruthy();
    expect(screen.getByLabelText('Bon de sortie remis')).toBeTruthy();
    expect(screen.getByLabelText('Archiver le BDT')).toBeTruthy();
    expect(screen.getByLabelText('Disabled')).toBeTruthy();
  });

  it("'Évaluation envoyée' cochée par défaut", () => {
    render(<UiKitCheckboxes />);
    const cb = screen.getByRole('checkbox', { name: 'Évaluation envoyée' });
    expect(cb.getAttribute('data-state')).toBe('checked');
  });

  it("'Bon de sortie remis' non coché par défaut", () => {
    render(<UiKitCheckboxes />);
    const cb = screen.getByRole('checkbox', { name: 'Bon de sortie remis' });
    expect(cb.getAttribute('data-state')).toBe('unchecked');
  });

  it("checkbox Disabled est disabled", () => {
    render(<UiKitCheckboxes />);
    const cb = screen.getByRole('checkbox', { name: 'Disabled' }) as HTMLButtonElement;
    expect(cb.disabled).toBe(true);
  });

  it("clic toggle 'Bon de sortie remis'", () => {
    render(<UiKitCheckboxes />);
    const cb = screen.getByRole('checkbox', { name: 'Bon de sortie remis' });
    expect(cb.getAttribute('data-state')).toBe('unchecked');
    fireEvent.click(cb);
    expect(cb.getAttribute('data-state')).toBe('checked');
  });
});
