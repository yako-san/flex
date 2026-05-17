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

  it('rendu compact V1 — sous-totaux services + pièces + grand total visibles', () => {
    const { container } = render(<BDCTotaux {...BASE} />);
    expect(screen.getByText('Services')).toBeTruthy();
    expect(screen.getByText('Pièces')).toBeTruthy();
    // Sous-totaux nets (après remises) affichés dans la pill noire.
    expect(container.textContent).toContain('100,00 $');
    expect(container.textContent).toContain('50,00 $');
    // Grand total affiché à droite.
    expect(container.textContent).toContain('172,46 $');
  });

  it('TPS/TVQ exposés via le title de la pill (lecture comptable détaillée)', () => {
    render(<BDCTotaux {...BASE} />);
    const aside = screen.getByLabelText('Totaux du BDT');
    expect(aside.getAttribute('title') ?? '').toContain('TPS 7,50 $');
    expect(aside.getAttribute('title') ?? '').toContain('TVQ 14,96 $');
  });

  it('remises services > 0 → sous-total services net affiché (100 - 10 = 90)', () => {
    const { container } = render(<BDCTotaux {...BASE} remiseServicesMontant={10} />);
    expect(container.textContent).toContain('90,00 $');
    // Détail de la remise dispo dans le title
    const aside = screen.getByLabelText('Totaux du BDT');
    expect(aside.getAttribute('title') ?? '').toContain('remise svc -10,00 $');
  });

  it("pas de mention de remise services si remiseServicesMontant = 0", () => {
    render(<BDCTotaux {...BASE} remiseServicesMontant={0} />);
    const aside = screen.getByLabelText('Totaux du BDT');
    expect(aside.getAttribute('title') ?? '').not.toContain('remise svc');
  });

  it('remises pièces > 0 → sous-total pièces net affiché (50 - 5 = 45)', () => {
    const { container } = render(<BDCTotaux {...BASE} remisePiecesMontant={5} />);
    expect(container.textContent).toContain('45,00 $');
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

  it('avance saisie → grand total barré + reste à payer en jaune', () => {
    const { container } = render(
      <BDCTotaux
        {...BASE}
        avance={{ montant: 50, mode: 'COMPTANT', note: null }}
      />,
    );
    // 172.46 - 50 = 122.46
    expect(container.textContent).toContain('122,46 $');
    // Grand total barré toujours visible
    expect(container.textContent).toContain('172,46 $');
    // Le grand total barré doit avoir la classe line-through
    const strikeSpan = container.querySelector('.line-through');
    expect(strikeSpan?.textContent).toContain('172,46 $');
  });

  it("avance > grand total → reste à payer = 0 (Math.max)", () => {
    const { container } = render(
      <BDCTotaux
        {...BASE}
        avance={{ montant: 500, mode: 'COMPTANT', note: null }}
      />,
    );
    expect(container.textContent).toContain('0,00 $');
  });

  it("pas de grand total barré si pas d'avance", () => {
    const { container } = render(<BDCTotaux {...BASE} avance={null} />);
    const strikeSpan = container.querySelector('.line-through');
    expect(strikeSpan).toBeNull();
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
