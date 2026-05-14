import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Button } from './button';

afterEach(() => cleanup());

describe('Button', () => {
  it('rend un <button> par défaut', () => {
    render(<Button>Test</Button>);
    expect(screen.getByRole('button').tagName).toBe('BUTTON');
  });

  it("variant 'primary' (default) → bg --jaune + text-black", () => {
    render(<Button>x</Button>);
    const cls = screen.getByRole('button').className;
    expect(cls).toContain('bg-[var(--jaune)]');
    expect(cls).toContain('text-black');
  });

  it("variant 'jaune' alias de primary", () => {
    render(<Button variant="jaune">x</Button>);
    expect(screen.getByRole('button').className).toContain('bg-[var(--jaune)]');
  });

  it("variant 'danger' → bg --rouge + text-white", () => {
    render(<Button variant="danger">x</Button>);
    const cls = screen.getByRole('button').className;
    expect(cls).toContain('bg-[var(--rouge)]');
    expect(cls).toContain('text-white');
  });

  it("variant 'secondary' → outline noir 50%", () => {
    render(<Button variant="secondary">x</Button>);
    const cls = screen.getByRole('button').className;
    expect(cls).toContain('bg-transparent');
    expect(cls).toContain('border-[var(--text-secondary-50)]');
  });

  it("variant 'dark' → bg --dark + hover-black", () => {
    render(<Button variant="dark">x</Button>);
    expect(screen.getByRole('button').className).toContain('bg-[var(--dark)]');
  });

  it("variant 'ghost' → transparent + normal-case (pas uppercase)", () => {
    render(<Button variant="ghost">x</Button>);
    expect(screen.getByRole('button').className).toContain('normal-case');
  });

  it("variant 'link' → underline-offset-4 + hover-underline", () => {
    render(<Button variant="link">x</Button>);
    const cls = screen.getByRole('button').className;
    expect(cls).toContain('hover:underline');
    expect(cls).toContain('underline-offset-4');
  });

  it("size 'sm' → h-[var(--btn-h-sm)] + px-4", () => {
    render(<Button size="sm">x</Button>);
    const cls = screen.getByRole('button').className;
    expect(cls).toContain('h-[var(--btn-h-sm)]');
    expect(cls).toContain('px-4');
  });

  it("size 'lg' → h-[var(--btn-h-lg)] + px-6", () => {
    render(<Button size="lg">x</Button>);
    const cls = screen.getByRole('button').className;
    expect(cls).toContain('h-[var(--btn-h-lg)]');
    expect(cls).toContain('px-6');
  });

  it("size 'icon' → carré w==h + p-0", () => {
    render(<Button size="icon">x</Button>);
    const cls = screen.getByRole('button').className;
    expect(cls).toContain('w-[var(--btn-h-md)]');
    expect(cls).toContain('p-0');
  });

  it('onClick appelé au clic', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>x</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disabled → cursor-not-allowed + opacity-40', () => {
    render(<Button disabled>x</Button>);
    const btn = screen.getByRole('button');
    expect(btn.hasAttribute('disabled')).toBe(true);
    expect(btn.className).toContain('disabled:cursor-not-allowed');
    expect(btn.className).toContain('disabled:opacity-40');
  });

  it('asChild=true → rend le child element (Slot Radix)', () => {
    render(
      <Button asChild>
        <a href="/x">Link</a>
      </Button>,
    );
    // Le bouton est remplacé par un <a>
    expect(screen.getByRole('link').tagName).toBe('A');
    expect(screen.getByRole('link').getAttribute('href')).toBe('/x');
  });

  it('forwardRef accessible', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<Button ref={ref}>x</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('className custom mergé via tailwind-merge', () => {
    render(<Button className="my-x">x</Button>);
    expect(screen.getByRole('button').className).toContain('my-x');
  });

  it('classes communes : font-weight V1 + uppercase + tracking', () => {
    render(<Button>x</Button>);
    const cls = screen.getByRole('button').className;
    expect(cls).toContain('uppercase');
    expect(cls).toContain('tracking-[0.1em]');
  });
});
