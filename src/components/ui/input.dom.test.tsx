import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Input, Textarea } from './input';

afterEach(() => cleanup());

describe('Input', () => {
  it('rend un <input type=text> par défaut', () => {
    render(<Input data-testid="i" />);
    const el = screen.getByTestId('i') as HTMLInputElement;
    expect(el.tagName).toBe('INPUT');
    expect(el.type).toBe('text');
  });

  it("respecte type='email'", () => {
    render(<Input type="email" data-testid="i" />);
    expect((screen.getByTestId('i') as HTMLInputElement).type).toBe('email');
  });

  it("respecte type='password'", () => {
    render(<Input type="password" data-testid="i" />);
    expect((screen.getByTestId('i') as HTMLInputElement).type).toBe('password');
  });

  it('onChange appelé sur input', () => {
    const onChange = vi.fn();
    render(<Input onChange={onChange} data-testid="i" />);
    fireEvent.change(screen.getByTestId('i'), { target: { value: 'hello' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('placeholder forwarded', () => {
    render(<Input placeholder="Tape ici" data-testid="i" />);
    expect((screen.getByTestId('i') as HTMLInputElement).placeholder).toBe('Tape ici');
  });

  it('disabled forwardé + classes disabled', () => {
    render(<Input disabled data-testid="i" />);
    const el = screen.getByTestId('i') as HTMLInputElement;
    expect(el.disabled).toBe(true);
    expect(el.className).toContain('disabled:cursor-not-allowed');
  });

  it('focus → classes border-[var(--jaune)]', () => {
    render(<Input data-testid="i" />);
    const el = screen.getByTestId('i');
    expect(el.className).toContain('focus:border-[var(--jaune)]');
  });

  it("md:text-sm (anti-zoom iOS, 14px desktop / 16px mobile)", () => {
    render(<Input data-testid="i" />);
    expect(screen.getByTestId('i').className).toContain('md:text-sm');
  });

  it('forwardRef accessible', () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('className custom mergé', () => {
    render(<Input className="my-x" data-testid="i" />);
    expect(screen.getByTestId('i').className).toContain('my-x');
  });
});

describe('Textarea', () => {
  it('rend un <textarea> avec rows=3 par défaut', () => {
    render(<Textarea data-testid="t" />);
    const el = screen.getByTestId('t') as HTMLTextAreaElement;
    expect(el.tagName).toBe('TEXTAREA');
    // happy-dom : el.rows peut être string '3'
    expect(Number(el.getAttribute('rows'))).toBe(3);
  });

  it('rows custom respecté', () => {
    render(<Textarea rows={8} data-testid="t" />);
    expect(Number(screen.getByTestId('t').getAttribute('rows'))).toBe(8);
  });

  it("resize-y (vertical seulement)", () => {
    render(<Textarea data-testid="t" />);
    expect(screen.getByTestId('t').className).toContain('resize-y');
  });

  it('onChange appelé', () => {
    const onChange = vi.fn();
    render(<Textarea onChange={onChange} data-testid="t" />);
    fireEvent.change(screen.getByTestId('t'), { target: { value: 'hi' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('forwardRef accessible', () => {
    const ref = { current: null as HTMLTextAreaElement | null };
    render(<Textarea ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });
});
