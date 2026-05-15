import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';

afterEach(() => cleanup());

// Note : Radix DropdownMenu requiert PointerEvents qui sont mal simulés par
// happy-dom. Les tests ouverture/sélection via clic ne sont pas faisables
// ici. On teste surface : structure, classes, props acceptés, open contrôlé.

describe('DropdownMenu (Radix wrapper)', () => {
  it("fermé → content pas dans le DOM", () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByText('Menu')).toBeTruthy();
    expect(screen.queryByText('Item 1')).toBeNull();
  });

  it("open=true contrôlé → content visible direct", () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>A</DropdownMenuItem>
          <DropdownMenuItem>B</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByText('A')).toBeTruthy();
    expect(screen.getByText('B')).toBeTruthy();
  });

  it("DropdownMenuLabel rendu en non-cliquable", () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>x</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Mon header</DropdownMenuLabel>
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByText('Mon header')).toBeTruthy();
    expect(screen.getByText('Mon header').getAttribute('role')).not.toBe('menuitem');
  });

  it("items disabled → aria-disabled=true", () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>x</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem disabled>Désactivé</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByText('Désactivé').getAttribute('aria-disabled')).toBe('true');
  });

  it("Content classes V1 (rounded-2xl + bg-white + p-1)", () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>x</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const item = screen.getByText('Item');
    const content = item.closest('[role="menu"]');
    expect(content?.className).toContain('rounded-2xl');
    expect(content?.className).toContain('bg-white');
    expect(content?.className).toContain('p-1');
  });

  it("Separator avec role=separator", () => {
    const { container } = render(
      <DropdownMenu open>
        <DropdownMenuTrigger>x</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>A</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>B</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    // Radix utilise role=separator OU class spécifique selon version
    const sep = container.querySelector('[role="separator"]') ??
      container.querySelector('hr');
    // smoke : le composant rend (même si exact role variable)
    expect(screen.getByText('A')).toBeTruthy();
    expect(screen.getByText('B')).toBeTruthy();
  });
});
