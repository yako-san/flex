import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('./actions', () => ({
  setFactureStatutAction: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/lib/utils/toast', () => ({ toast: vi.fn() }));

vi.mock('@/components/ui/confirm-dialog', () => ({
  customConfirm: vi.fn().mockResolvedValue(true),
}));

import { FactureStatutControls } from './facture-statut-controls';

describe('FactureStatutControls', () => {
  it("statut EMIS → label 'Émise' sans mode paiement", () => {
    render(<FactureStatutControls factureLogId="f1" statut="EMIS" modePaiement={null} />);
    expect(screen.getByText('Émise')).toBeTruthy();
  });

  it("statut PAYE + mode → label 'Payée' avec mode entre parenthèses", () => {
    render(<FactureStatutControls factureLogId="f1" statut="PAYE" modePaiement="INTERAC" />);
    expect(screen.getByText('Payée')).toBeTruthy();
    expect(screen.getByText('(interac)')).toBeTruthy();
  });

  it("statut PAYE sans mode → pas de parenthèses", () => {
    render(<FactureStatutControls factureLogId="f1" statut="PAYE" modePaiement={null} />);
    expect(screen.getByText('Payée')).toBeTruthy();
    expect(screen.queryByText(/\(/)).toBeNull();
  });

  it("statut ANNULE → label 'Annulée'", () => {
    render(<FactureStatutControls factureLogId="f1" statut="ANNULE" modePaiement={null} />);
    expect(screen.getByText('Annulée')).toBeTruthy();
  });

  it("bouton trigger a aria/title approprié", () => {
    render(<FactureStatutControls factureLogId="f1" statut="EMIS" modePaiement={null} />);
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('title')).toContain('changer le statut');
  });

  it("popover fermé par défaut → MenuItem pas visible", () => {
    render(<FactureStatutControls factureLogId="f1" statut="EMIS" modePaiement={null} />);
    expect(screen.queryByText(/Marquer payée/i)).toBeNull();
  });
});
