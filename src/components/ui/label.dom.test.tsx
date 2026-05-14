import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Label } from './label';
import { Input } from './input';

afterEach(() => cleanup());

describe('Label', () => {
  it('rend un <label>', () => {
    render(<Label>Mon label</Label>);
    expect(screen.getByText('Mon label').tagName).toBe('LABEL');
  });

  it("classes V1 : text-[11px] lowercase font-semibold", () => {
    const { container } = render(<Label>x</Label>);
    const cls = container.querySelector('label')?.className;
    expect(cls).toContain('text-[11px]');
    expect(cls).toContain('lowercase');
    expect(cls).toContain('font-semibold');
  });

  it("htmlFor associe à un input via id", () => {
    render(
      <>
        <Label htmlFor="my-input">Prénom</Label>
        <Input id="my-input" data-testid="inp" />
      </>,
    );
    // Le label est associé à l'input
    const input = screen.getByLabelText('Prénom') as HTMLInputElement;
    expect(input.id).toBe('my-input');
  });

  it('className custom mergé', () => {
    const { container } = render(<Label className="custom-x">x</Label>);
    expect(container.querySelector('label')?.className).toContain('custom-x');
  });

  it('peer-disabled : ne casse pas si parent peer disabled', () => {
    // Test surface seulement — pas de comportement runtime simulable simplement
    const { container } = render(<Label>x</Label>);
    expect(container.querySelector('label')?.className).toContain(
      'peer-disabled:cursor-not-allowed',
    );
  });

  it('forwardRef accessible', () => {
    const ref = { current: null as HTMLLabelElement | null };
    render(<Label ref={ref}>x</Label>);
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });

  it("rend les enfants ReactNode (icône + texte)", () => {
    render(
      <Label>
        <span data-testid="icon">★</span> Champ requis
      </Label>,
    );
    expect(screen.getByTestId('icon')).toBeTruthy();
    expect(screen.getByText(/Champ requis/)).toBeTruthy();
  });
});
