import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { RemiseInput } from './remise-input';

afterEach(() => cleanup());

describe('RemiseInput', () => {
  it("rend input number + 2 boutons radio (% / $)", () => {
    render(<RemiseInput value={null} type="PCT" onChange={() => {}} />);
    expect(screen.getByRole('spinbutton')).toBeTruthy(); // type=number
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it('value null → input vide', () => {
    render(<RemiseInput value={null} type="PCT" onChange={() => {}} />);
    expect((screen.getByRole('spinbutton') as HTMLInputElement).value).toBe('');
  });

  it('value 25 → input affiche "25"', () => {
    render(<RemiseInput value={25} type="PCT" onChange={() => {}} />);
    expect((screen.getByRole('spinbutton') as HTMLInputElement).value).toBe('25');
  });

  it("type 'PCT' actif → bouton % aria-checked=true", () => {
    render(<RemiseInput value={null} type="PCT" onChange={() => {}} />);
    expect(screen.getByLabelText('Pourcentage').getAttribute('aria-checked')).toBe('true');
    expect(screen.getByLabelText('Montant').getAttribute('aria-checked')).toBe('false');
  });

  it("type 'MONTANT' actif → bouton $ aria-checked=true", () => {
    render(<RemiseInput value={null} type="MONTANT" onChange={() => {}} />);
    expect(screen.getByLabelText('Montant').getAttribute('aria-checked')).toBe('true');
    expect(screen.getByLabelText('Pourcentage').getAttribute('aria-checked')).toBe('false');
  });

  it("max=100 quand type='PCT'", () => {
    render(<RemiseInput value={null} type="PCT" onChange={() => {}} />);
    expect(screen.getByRole('spinbutton').getAttribute('max')).toBe('100');
  });

  it("pas de max quand type='MONTANT'", () => {
    render(<RemiseInput value={null} type="MONTANT" onChange={() => {}} />);
    expect(screen.getByRole('spinbutton').getAttribute('max')).toBeNull();
  });

  it("step=0.5 pour PCT, 0.01 pour MONTANT", () => {
    const { rerender } = render(
      <RemiseInput value={null} type="PCT" onChange={() => {}} />,
    );
    expect(screen.getByRole('spinbutton').getAttribute('step')).toBe('0.5');
    rerender(<RemiseInput value={null} type="MONTANT" onChange={() => {}} />);
    expect(screen.getByRole('spinbutton').getAttribute('step')).toBe('0.01');
  });

  it("saisie valide → onChange avec value clampée", () => {
    const onChange = vi.fn();
    render(<RemiseInput value={null} type="PCT" onChange={onChange} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '50' } });
    expect(onChange).toHaveBeenCalledWith({ value: 50, type: 'PCT' });
  });

  it("PCT : value > 100 clampée à 100", () => {
    const onChange = vi.fn();
    render(<RemiseInput value={null} type="PCT" onChange={onChange} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '150' } });
    expect(onChange).toHaveBeenCalledWith({ value: 100, type: 'PCT' });
  });

  it("PCT : value < 0 clampée à 0", () => {
    const onChange = vi.fn();
    render(<RemiseInput value={null} type="PCT" onChange={onChange} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '-5' } });
    expect(onChange).toHaveBeenCalledWith({ value: 0, type: 'PCT' });
  });

  it("MONTANT : value < 0 clampée à 0", () => {
    const onChange = vi.fn();
    render(<RemiseInput value={null} type="MONTANT" onChange={onChange} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '-10' } });
    expect(onChange).toHaveBeenCalledWith({ value: 0, type: 'MONTANT' });
  });

  it("MONTANT : value > 100 non clampée (acceptée)", () => {
    const onChange = vi.fn();
    render(<RemiseInput value={null} type="MONTANT" onChange={onChange} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '250' } });
    expect(onChange).toHaveBeenCalledWith({ value: 250, type: 'MONTANT' });
  });

  it("saisie vide → value: null", () => {
    const onChange = vi.fn();
    render(<RemiseInput value={50} type="PCT" onChange={onChange} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith({ value: null, type: 'PCT' });
  });

  it("clic '$' switche type vers MONTANT (préserve value)", () => {
    const onChange = vi.fn();
    render(<RemiseInput value={20} type="PCT" onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Montant'));
    expect(onChange).toHaveBeenCalledWith({ value: 20, type: 'MONTANT' });
  });

  it("clic '%' switche type vers PCT (préserve value)", () => {
    const onChange = vi.fn();
    render(<RemiseInput value={15} type="MONTANT" onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Pourcentage'));
    expect(onChange).toHaveBeenCalledWith({ value: 15, type: 'PCT' });
  });

  it('disabled forwardé sur input et boutons', () => {
    render(<RemiseInput value={null} type="PCT" onChange={() => {}} disabled />);
    expect((screen.getByRole('spinbutton') as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText('Pourcentage') as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText('Montant') as HTMLButtonElement).disabled).toBe(true);
  });

  it("size='sm' → h-8", () => {
    const { container } = render(
      <RemiseInput value={null} type="PCT" onChange={() => {}} size="sm" />,
    );
    expect(container.querySelector('.h-8')).toBeTruthy();
  });

  it("ariaLabel custom sur input", () => {
    render(
      <RemiseInput
        value={null}
        type="PCT"
        onChange={() => {}}
        ariaLabel="Remise services"
      />,
    );
    expect(screen.getByLabelText('Remise services')).toBeTruthy();
  });

  it("id forwardé pour pairing avec Label externe", () => {
    render(<RemiseInput value={null} type="PCT" onChange={() => {}} id="my-input" />);
    expect(screen.getByRole('spinbutton').id).toBe('my-input');
  });

  it("NaN ignoré (pas d'appel onChange)", () => {
    const onChange = vi.fn();
    render(<RemiseInput value={null} type="PCT" onChange={onChange} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: 'abc' } });
    // happy-dom convertit "abc" en number → NaN, onChange ne devrait pas être appelé
    expect(onChange).not.toHaveBeenCalled();
  });
});
