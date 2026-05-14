import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AddButton, IconButton, UtilButton } from './icon-button';

afterEach(() => cleanup());

describe('IconButton', () => {
  it('rend <button type=button> par défaut', () => {
    render(<IconButton aria-label="Ajouter">+</IconButton>);
    const btn = screen.getByRole('button', { name: 'Ajouter' });
    expect(btn.tagName).toBe('BUTTON');
    expect(btn.getAttribute('type')).toBe('button');
  });

  it("tone 'add' (default) → bg --jaune + shadow", () => {
    render(<IconButton aria-label="x">+</IconButton>);
    const cls = screen.getByRole('button').className;
    expect(cls).toContain('bg-[var(--jaune)]');
    expect(cls).toContain('shadow-');
  });

  it("tone 'addOutline' → bg transparent + border", () => {
    render(<IconButton aria-label="x" tone="addOutline">+</IconButton>);
    const cls = screen.getByRole('button').className;
    expect(cls).toContain('bg-transparent');
    expect(cls).toContain('border-[1.5px]');
  });

  it("tone 'util' → bg-white + border gris", () => {
    render(<IconButton aria-label="x" tone="util">⚙</IconButton>);
    const cls = screen.getByRole('button').className;
    expect(cls).toContain('bg-white');
    expect(cls).toContain('border-[var(--gris-bord)]');
  });

  it("tone 'utilDark' → fond sombre", () => {
    render(<IconButton aria-label="x" tone="utilDark">⚙</IconButton>);
    expect(screen.getByRole('button').className).toContain('bg-[var(--overlay-dark-20)]');
  });

  it("tone 'danger' → rouge plein", () => {
    render(<IconButton aria-label="x" tone="danger">×</IconButton>);
    const cls = screen.getByRole('button').className;
    expect(cls).toContain('bg-[var(--rouge)]');
    expect(cls).toContain('text-white');
  });

  it("size 'sm' → 32px", () => {
    render(<IconButton aria-label="x" size="sm">+</IconButton>);
    const cls = screen.getByRole('button').className;
    expect(cls).toContain('h-[32px]');
    expect(cls).toContain('w-[32px]');
  });

  it("size 'lg' → 44px", () => {
    render(<IconButton aria-label="x" size="lg">+</IconButton>);
    const cls = screen.getByRole('button').className;
    expect(cls).toContain('h-[44px]');
    expect(cls).toContain('w-[44px]');
  });

  it("rounded-full (cercle)", () => {
    render(<IconButton aria-label="x">+</IconButton>);
    expect(screen.getByRole('button').className).toContain('rounded-full');
  });

  it('onClick appelé', () => {
    const onClick = vi.fn();
    render(<IconButton aria-label="x" onClick={onClick}>+</IconButton>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });

  it("type prop override possible (submit)", () => {
    render(<IconButton aria-label="x" type="submit">+</IconButton>);
    expect(screen.getByRole('button').getAttribute('type')).toBe('submit');
  });

  it('forwardRef accessible', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<IconButton aria-label="x" ref={ref}>+</IconButton>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('disabled forwardé', () => {
    render(<IconButton aria-label="x" disabled>+</IconButton>);
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true);
  });

  it("aria-label requis et présent", () => {
    render(<IconButton aria-label="Ajouter un item">+</IconButton>);
    expect(screen.getByLabelText('Ajouter un item')).toBeTruthy();
  });
});

describe('AddButton', () => {
  it("alias de IconButton tone='add' size='md'", () => {
    render(<AddButton aria-label="x">+</AddButton>);
    const cls = screen.getByRole('button').className;
    expect(cls).toContain('bg-[var(--jaune)]');
    expect(cls).toContain('h-[var(--addbtn-size)]');
  });
});

describe('UtilButton', () => {
  it("alias de IconButton tone='util' size='sm'", () => {
    render(<UtilButton aria-label="x">⚙</UtilButton>);
    const cls = screen.getByRole('button').className;
    expect(cls).toContain('bg-white');
    expect(cls).toContain('h-[32px]');
  });
});
