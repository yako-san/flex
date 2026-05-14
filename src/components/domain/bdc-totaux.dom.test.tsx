import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BDCTotaux } from './bdc-totaux';

afterEach(() => cleanup());

const BASE = {
  sousTotalServices: 100,
  sousTotalPieces: 50,
  tps: 7.5,
  tvq: 14.96,
  grandTotal: 172.46,
};

describe('BDCTotaux', () => {
  it("rend <aside> avec aria-label 'Totaux du BDT'", () => {
    render(<BDCTotaux {...BASE} />);
    expect(screen.getByLabelText('Totaux du BDT')).toBeTruthy();
  });

  it('affiche les 5 lignes : services, pièces, TPS, TVQ, grand total', () => {
    render(<BDCTotaux {...BASE} />);
    expect(screen.getByText('Sous-total services')).toBeTruthy();
    expect(screen.getByText('Sous-total pièces')).toBeTruthy();
    expect(screen.getByText('TPS')).toBeTruthy();
    expect(screen.getByText('TVQ')).toBeTruthy();
    expect(screen.getByText('Grand total')).toBeTruthy();
  });

  it('format français avec virgule décimale + suffixe $', () => {
    const { container } = render(<BDCTotaux {...BASE} />);
    expect(container.textContent).toContain('100,00 $');
    expect(container.textContent).toContain('50,00 $');
    expect(container.textContent).toContain('7,50 $');
    expect(container.textContent).toContain('14,96 $');
    expect(container.textContent).toContain('172,46 $');
  });

  it('remises services > 0 → ligne Remise services en rouge avec −', () => {
    render(<BDCTotaux {...BASE} remiseServicesMontant={10} />);
    expect(screen.getByText('Remise services')).toBeTruthy();
    // La ligne contient "−10,00 $" (le préfixe − vient du component)
  });

  it("pas de ligne Remise services si remiseServicesMontant = 0", () => {
    render(<BDCTotaux {...BASE} remiseServicesMontant={0} />);
    expect(screen.queryByText('Remise services')).toBeNull();
  });

  it('remises pièces > 0 → ligne Remise pièces', () => {
    render(<BDCTotaux {...BASE} remisePiecesMontant={5} />);
    expect(screen.getByText('Remise pièces')).toBeTruthy();
  });

  it("avance null → pill 'avance ?' (pas de detail)", () => {
    render(<BDCTotaux {...BASE} avance={null} />);
    expect(screen.getByText(/avance/i)).toBeTruthy();
    // Pas de mode listé
    expect(screen.queryByText(/Interac|Comptant|Cartes/)).toBeNull();
  });

  it("avance présent → pill 'avance : XX $ · Mode'", () => {
    render(
      <BDCTotaux
        {...BASE}
        avance={{ montant: 42.5, mode: 'INTERAC', note: null }}
      />,
    );
    expect(screen.getByText(/Interac/)).toBeTruthy();
    expect(screen.getByText(/42,50 \$/)).toBeTruthy();
  });

  it('avance saisie → Reste à payer affiché', () => {
    render(
      <BDCTotaux
        {...BASE}
        avance={{ montant: 50, mode: 'COMPTANT', note: null }}
      />,
    );
    expect(screen.getByText(/Reste à payer/i)).toBeTruthy();
    // 172.46 - 50 = 122.46
    const container = screen.getByText(/Reste à payer/i).parentElement!;
    expect(container.textContent).toContain('122,46 $');
  });

  it("avance > grand total → Reste à payer = 0 (Math.max)", () => {
    render(
      <BDCTotaux
        {...BASE}
        avance={{ montant: 500, mode: 'COMPTANT', note: null }}
      />,
    );
    expect(screen.getByText(/Reste à payer/i).parentElement!.textContent).toContain(
      '0,00 $',
    );
  });

  it('pas de Reste à payer si pas d\'avance', () => {
    render(<BDCTotaux {...BASE} avance={null} />);
    expect(screen.queryByText(/Reste à payer/i)).toBeNull();
  });

  it("clic pill 'avance' ouvre le modal (Radix Dialog)", () => {
    render(<BDCTotaux {...BASE} avance={null} />);
    const pillBtn = screen.getByRole('button', { name: /avance/i });
    fireEvent.click(pillBtn);
    // Le DialogTitle est portallé hors du composant — happy-dom le rend en body
    expect(screen.getByText('Avance client')).toBeTruthy();
  });

  it('className custom mergé sur <aside>', () => {
    render(<BDCTotaux {...BASE} className="my-x" />);
    expect(screen.getByLabelText('Totaux du BDT').className).toContain('my-x');
  });

  it('onAvanceChange pas appelé sans interaction', () => {
    const onChange = vi.fn();
    render(<BDCTotaux {...BASE} onAvanceChange={onChange} />);
    expect(onChange).not.toHaveBeenCalled();
  });
});
