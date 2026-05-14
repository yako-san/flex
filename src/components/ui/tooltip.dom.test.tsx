import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

afterEach(() => cleanup());

describe('Tooltip (Radix wrapper)', () => {
  it("rend TooltipTrigger + TooltipContent dans une structure Provider", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button>Trigger</button>
          </TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(screen.getByText('Trigger')).toBeTruthy();
  });

  it("Tooltip fermé par défaut → content pas visible dans le DOM", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button>Trigger</button>
          </TooltipTrigger>
          <TooltipContent>Hidden</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(screen.queryByText('Hidden')).toBeNull();
  });

  it("sideOffset prop accepté sans crash", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button>T</button>
          </TooltipTrigger>
          <TooltipContent sideOffset={10}>x</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(screen.getByText('T')).toBeTruthy();
  });

  it("Provider expose ses enfants (smoke)", () => {
    render(
      <TooltipProvider>
        <div data-testid="child">child</div>
      </TooltipProvider>,
    );
    expect(screen.getByTestId('child')).toBeTruthy();
  });

  it("TooltipTrigger asChild forwarde le button comme trigger", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button data-testid="my-trigger">My trigger</button>
          </TooltipTrigger>
          <TooltipContent>x</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(screen.getByTestId('my-trigger').tagName).toBe('BUTTON');
  });
});
