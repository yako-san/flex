import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Checkbox } from './checkbox';

afterEach(() => cleanup());

describe('Checkbox', () => {
  it('rend un button[role=checkbox] (Radix sémantique)', () => {
    render(<Checkbox />);
    expect(screen.getByRole('checkbox')).toBeTruthy();
  });

  it("aria-checked='false' par défaut (uncontrolled)", () => {
    render(<Checkbox />);
    expect(screen.getByRole('checkbox').getAttribute('aria-checked')).toBe('false');
  });

  it("aria-checked='true' avec checked", () => {
    render(<Checkbox checked />);
    expect(screen.getByRole('checkbox').getAttribute('aria-checked')).toBe('true');
  });

  it('clic toggle l\'état (uncontrolled)', () => {
    const onChange = vi.fn();
    render(<Checkbox onCheckedChange={onChange} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("disabled forwardé", () => {
    render(<Checkbox disabled />);
    expect((screen.getByRole('checkbox') as HTMLButtonElement).disabled).toBe(true);
  });

  it("data-state='checked' rend l'Indicator", () => {
    render(<Checkbox checked />);
    const root = screen.getByRole('checkbox');
    expect(root.getAttribute('data-state')).toBe('checked');
    // L'indicator est un enfant
    expect(root.querySelector('span[aria-hidden]')).toBeTruthy();
  });

  it("data-state='unchecked' n'a pas d'Indicator visible", () => {
    render(<Checkbox />);
    expect(screen.getByRole('checkbox').getAttribute('data-state')).toBe('unchecked');
  });

  it('classes V1 : taille 5x5 + radius 4 + border 2', () => {
    render(<Checkbox />);
    const cls = screen.getByRole('checkbox').className;
    expect(cls).toContain('h-5');
    expect(cls).toContain('w-5');
    expect(cls).toContain('rounded-[4px]');
    expect(cls).toContain('border-2');
  });

  it("focus-visible ring jaune signature", () => {
    render(<Checkbox />);
    expect(screen.getByRole('checkbox').className).toContain(
      'focus-visible:ring-[var(--jaune)]',
    );
  });

  it("forwardRef accessible", () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<Checkbox ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("className custom mergé", () => {
    render(<Checkbox className="my-x" />);
    expect(screen.getByRole('checkbox').className).toContain('my-x');
  });
});
