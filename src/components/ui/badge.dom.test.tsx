import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Badge } from './badge';

describe('Badge', () => {
  it('rend un <div>', () => {
    const { container } = render(<Badge>Hello</Badge>);
    expect(container.querySelector('div')).toBeTruthy();
    expect(container.textContent).toBe('Hello');
  });

  it("variant 'default' par défaut → bg --jaune + text-black", () => {
    const { container } = render(<Badge>x</Badge>);
    const cls = container.querySelector('div')?.className;
    expect(cls).toContain('bg-[var(--jaune)]');
    expect(cls).toContain('text-black');
  });

  it("variant 'secondary' → bg white/60", () => {
    const { container } = render(<Badge variant="secondary">x</Badge>);
    expect(container.querySelector('div')?.className).toContain('bg-white/60');
  });

  it("variant 'outline' → bg-transparent + border-2", () => {
    const { container } = render(<Badge variant="outline">x</Badge>);
    const cls = container.querySelector('div')?.className;
    expect(cls).toContain('bg-transparent');
    expect(cls).toContain('border-2');
  });

  it("variant 'destructive' → bg --rouge + text-white", () => {
    const { container } = render(<Badge variant="destructive">x</Badge>);
    const cls = container.querySelector('div')?.className;
    expect(cls).toContain('bg-[var(--rouge)]');
    expect(cls).toContain('text-white');
  });

  it('passe les props HTML standard', () => {
    const { container } = render(
      <Badge data-testid="bdg" title="t" id="my-id">
        x
      </Badge>,
    );
    const el = container.querySelector('#my-id');
    expect(el).toBeTruthy();
    expect(el?.getAttribute('title')).toBe('t');
    expect(el?.getAttribute('data-testid')).toBe('bdg');
  });

  it('merge className custom (tailwind-merge ne casse pas)', () => {
    const { container } = render(<Badge className="my-extra">x</Badge>);
    expect(container.querySelector('div')?.className).toContain('my-extra');
  });

  it('classes communes : rounded-full + uppercase + font-bold', () => {
    const { container } = render(<Badge>x</Badge>);
    const cls = container.querySelector('div')?.className;
    expect(cls).toContain('rounded-full');
    expect(cls).toContain('uppercase');
    expect(cls).toContain('font-bold');
  });
});
