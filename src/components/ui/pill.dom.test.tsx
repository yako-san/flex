import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Pill } from './pill';

describe('Pill', () => {
  it('rend un <span>', () => {
    const { container } = render(<Pill>Test</Pill>);
    expect(container.querySelector('span')).toBeTruthy();
    expect(container.textContent).toBe('Test');
  });

  it("variant 'neutral' par défaut", () => {
    const { container } = render(<Pill>Default</Pill>);
    expect(container.querySelector('span')?.className).toContain(
      'bg-[var(--gris-bord)]',
    );
  });

  it("variant 'rv' → bg --st-rv-bg", () => {
    const { container } = render(<Pill variant="rv">RV</Pill>);
    expect(container.querySelector('span')?.className).toContain(
      'bg-[var(--st-rv-bg)]',
    );
  });

  it("variant 'approuve' → bg --st-approuve-bg", () => {
    const { container } = render(<Pill variant="approuve">APPROUVÉ</Pill>);
    expect(container.querySelector('span')?.className).toContain(
      'bg-[var(--st-approuve-bg)]',
    );
  });

  it("variant 'cmd-listee' → border (seul variant avec bordure)", () => {
    const { container } = render(<Pill variant="cmd-listee">Listée</Pill>);
    const cls = container.querySelector('span')?.className;
    expect(cls).toContain('bg-[var(--cmd-listee-bg)]');
    expect(cls).toContain('border');
  });

  it("variant 'staff' → bg gris clair texte gris", () => {
    const { container } = render(<Pill variant="staff">Staff</Pill>);
    const cls = container.querySelector('span')?.className;
    expect(cls).toContain('#eeeeee');
    expect(cls).toContain('#666');
  });

  it("size 'sm' → text-[10px]", () => {
    const { container } = render(<Pill size="sm">x</Pill>);
    expect(container.querySelector('span')?.className).toContain('text-[10px]');
  });

  it("size 'lg' → text-sm + px-3", () => {
    const { container } = render(<Pill size="lg">x</Pill>);
    const cls = container.querySelector('span')?.className;
    expect(cls).toContain('text-sm');
    expect(cls).toContain('px-3');
  });

  it('accepte className custom', () => {
    const { container } = render(<Pill className="extra-class">x</Pill>);
    expect(container.querySelector('span')?.className).toContain('extra-class');
  });

  it("passe les props HTML standard (data-, title)", () => {
    const { container } = render(
      <Pill data-testid="my-pill" title="Tooltip">
        x
      </Pill>,
    );
    const el = container.querySelector('[data-testid="my-pill"]');
    expect(el).toBeTruthy();
    expect(el?.getAttribute('title')).toBe('Tooltip');
  });

  it('classes communes : rounded-full + uppercase + tracking-wider', () => {
    const { container } = render(<Pill>x</Pill>);
    const cls = container.querySelector('span')?.className;
    expect(cls).toContain('rounded-full');
    expect(cls).toContain('uppercase');
    expect(cls).toContain('tracking-wider');
  });
});
