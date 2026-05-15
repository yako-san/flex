import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('./emit-facture-action', () => ({
  emitFactureAction: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/lib/utils/toast', () => ({ toast: vi.fn() }));

vi.mock('@/components/ui/confirm-dialog', () => ({
  customConfirm: vi.fn().mockResolvedValue(true),
}));

import { PdfButtons } from './pdf-buttons';

describe('PdfButtons', () => {
  it("rend toujours un lien Évaluation PDF", () => {
    render(
      <PdfButtons bdcId="b1" existingFactureLogId={null} existingFactureNumero={null} />,
    );
    const link = screen.getByText(/Évaluation \(PDF\)/).closest('a');
    expect(link?.getAttribute('href')).toBe('/api/admin/bdcs/b1/eval.pdf');
    expect(link?.getAttribute('target')).toBe('_blank');
  });

  it("facture existante → lien Facture {numero} (PDF)", () => {
    render(
      <PdfButtons bdcId="b1" existingFactureLogId="fl42" existingFactureNumero="F-2025-001" />,
    );
    const link = screen.getByText(/Facture F-2025-001/).closest('a');
    expect(link?.getAttribute('href')).toBe('/api/admin/factures/fl42/pdf');
  });

  it("facture existante → pas de form d'émission visible", () => {
    render(
      <PdfButtons bdcId="b1" existingFactureLogId="fl1" existingFactureNumero="F-001" />,
    );
    expect(screen.queryByText('Émettre la facture')).toBeNull();
  });

  it("pas de facture → form d'émission visible avec select", () => {
    render(
      <PdfButtons bdcId="b1" existingFactureLogId={null} existingFactureNumero={null} />,
    );
    // 'Émettre la facture' apparaît 2x (header + bouton)
    expect(screen.getAllByText('Émettre la facture').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('combobox')).toBeTruthy();
  });

  it("select émission contient les 4 modes + 1 placeholder", () => {
    render(
      <PdfButtons bdcId="b1" existingFactureLogId={null} existingFactureNumero={null} />,
    );
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.options.length).toBe(5);
    expect(select.options[0]!.value).toBe('');
    expect(select.options[1]!.value).toBe('COMPTANT');
  });

  it("bouton 'Émettre la facture' type=button (pas submit)", () => {
    render(
      <PdfButtons bdcId="b1" existingFactureLogId={null} existingFactureNumero={null} />,
    );
    const btns = screen.getAllByRole('button', { name: /Émettre/ });
    expect(btns[0]!.getAttribute('type')).toBe('button');
  });
});
