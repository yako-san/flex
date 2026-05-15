import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

afterEach(() => cleanup());

describe('Select (Radix wrapper)', () => {
  it("rend trigger avec placeholder par défaut", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Choisir…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByText('Choisir…')).toBeTruthy();
  });

  it("fermé → items pas dans le DOM", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Item A</SelectItem>
          <SelectItem value="b">Item B</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.queryByText('Item A')).toBeNull();
    expect(screen.queryByText('Item B')).toBeNull();
  });

  it("trigger classes V1 : rounded-xl + border-[1.5px] + focus jaune", () => {
    render(
      <Select>
        <SelectTrigger data-testid="t">
          <SelectValue />
        </SelectTrigger>
      </Select>,
    );
    const trigger = screen.getByTestId('t');
    expect(trigger.className).toContain('rounded-xl');
    expect(trigger.className).toContain('border-[1.5px]');
    expect(trigger.className).toContain('focus:border-[var(--jaune)]');
  });

  it("trigger disabled forwardé", () => {
    render(
      <Select disabled>
        <SelectTrigger data-testid="t">
          <SelectValue />
        </SelectTrigger>
      </Select>,
    );
    expect((screen.getByTestId('t') as HTMLButtonElement).disabled).toBe(true);
  });

  it("value contrôlé : 'b' → texte Item B affiché", () => {
    render(
      <Select value="b" onValueChange={() => {}}>
        <SelectTrigger>
          <SelectValue placeholder="Choisir…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
          <SelectItem value="b">B</SelectItem>
        </SelectContent>
      </Select>,
    );
    // La valeur sélectionnée est rendue dans le trigger
    expect(screen.getByRole('combobox').textContent).toContain('B');
  });

  it("onValueChange callback fourni (smoke)", () => {
    const onValueChange = vi.fn();
    render(
      <Select onValueChange={onValueChange}>
        <SelectTrigger data-testid="t">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>,
    );
    // Le callback n'est pas appelé sans interaction
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("ChevronDown icon (caret) dans le trigger", () => {
    const { container } = render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="x" />
        </SelectTrigger>
      </Select>,
    );
    // ChevronDown rend un SVG inline
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it("trigger a role=combobox + aria-expanded", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="x" />
        </SelectTrigger>
      </Select>,
    );
    const trigger = screen.getByRole('combobox');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it("clic trigger ouvre (aria-expanded=true)", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="x" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>,
    );
    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });
});
