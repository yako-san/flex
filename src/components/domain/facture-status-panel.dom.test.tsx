import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { FactureStatusPanel } from './facture-status-panel';

afterEach(() => cleanup());

const BASE = {
  factureNumero: 'F0042-2026-05-14',
  date: new Date('2026-05-14T12:00:00Z'),
  statut: 'EMIS' as const,
  modePaiement: null,
  grandTotal: 234.56,
};

describe('FactureStatusPanel', () => {
  it("<section> avec aria-label 'Facture émise'", () => {
    render(<FactureStatusPanel {...BASE} />);
    expect(screen.getByLabelText('Facture émise')).toBeTruthy();
  });

  it('affiche numéro de facture', () => {
    render(<FactureStatusPanel {...BASE} />);
    expect(screen.getByText('F0042-2026-05-14')).toBeTruthy();
  });

  it('format date fr-CA (YYYY-MM-DD)', () => {
    render(<FactureStatusPanel {...BASE} />);
    expect(screen.getByText('2026-05-14')).toBeTruthy();
  });

  it('accepte date en string ISO', () => {
    render(<FactureStatusPanel {...BASE} date="2026-01-15T00:00:00Z" />);
    expect(screen.getByText('2026-01-15')).toBeTruthy();
  });

  it("format grand total en français avec virgule + $", () => {
    render(<FactureStatusPanel {...BASE} />);
    expect(screen.getByText('234,56 $')).toBeTruthy();
  });

  it("statut EMIS → label 'émise' (pill variant facture)", () => {
    render(<FactureStatusPanel {...BASE} statut="EMIS" />);
    expect(screen.getByText('émise')).toBeTruthy();
  });

  it("statut PAYE → label 'payée' (pill variant on-bench)", () => {
    render(<FactureStatusPanel {...BASE} statut="PAYE" />);
    expect(screen.getByText('payée')).toBeTruthy();
  });

  it("statut ANNULE → label 'annulée' (pill variant fini)", () => {
    render(<FactureStatusPanel {...BASE} statut="ANNULE" />);
    expect(screen.getByText('annulée')).toBeTruthy();
  });

  it("modePaiement null → '—'", () => {
    render(<FactureStatusPanel {...BASE} modePaiement={null} />);
    // Le label apparaît à côté du mot 'mode :'
    const container = screen.getByLabelText('Facture émise');
    expect(container.textContent).toContain('mode :');
    expect(container.textContent).toContain('—');
  });

  it("modePaiement COMPTANT → 'Comptant'", () => {
    render(<FactureStatusPanel {...BASE} modePaiement="COMPTANT" />);
    expect(screen.getByText('Comptant')).toBeTruthy();
  });

  it("modePaiement INTERAC → 'Interac'", () => {
    render(<FactureStatusPanel {...BASE} modePaiement="INTERAC" />);
    expect(screen.getByText('Interac')).toBeTruthy();
  });

  it("modePaiement CHEQUE → 'Chèque'", () => {
    render(<FactureStatusPanel {...BASE} modePaiement="CHEQUE" />);
    expect(screen.getByText('Chèque')).toBeTruthy();
  });

  it("modePaiement AUTRE → 'Autre'", () => {
    render(<FactureStatusPanel {...BASE} modePaiement="AUTRE" />);
    expect(screen.getByText('Autre')).toBeTruthy();
  });

  it("pdfUrl rendu en lien externe avec target=_blank", () => {
    render(<FactureStatusPanel {...BASE} pdfUrl="/api/factures/x/pdf" />);
    const link = screen.getByText(/PDF/);
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener');
  });

  it("pas de lien PDF si pdfUrl absent", () => {
    render(<FactureStatusPanel {...BASE} />);
    expect(screen.queryByText(/PDF/)).toBeNull();
  });

  it('statutControls slot rendu', () => {
    render(
      <FactureStatusPanel
        {...BASE}
        statutControls={<button data-testid="ctrl">Marquer payée</button>}
      />,
    );
    expect(screen.getByTestId('ctrl')).toBeTruthy();
  });

  it('className custom mergé sur <section>', () => {
    render(<FactureStatusPanel {...BASE} className="my-x" />);
    expect(screen.getByLabelText('Facture émise').className).toContain('my-x');
  });

  it("'Facture' label en uppercase tracking-wider", () => {
    render(<FactureStatusPanel {...BASE} />);
    const lbl = screen.getByText('Facture');
    expect(lbl.className).toContain('uppercase');
    expect(lbl.className).toContain('tracking-wider');
  });
});
