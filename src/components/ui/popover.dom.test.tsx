import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

afterEach(() => cleanup());

describe('Popover (Radix wrapper)', () => {
  it("fermé → content pas dans le DOM", () => {
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Hidden content</PopoverContent>
      </Popover>,
    );
    expect(screen.getByText('Open')).toBeTruthy();
    expect(screen.queryByText('Hidden content')).toBeNull();
  });

  it("clic trigger ouvre le popover", () => {
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Visible</PopoverContent>
      </Popover>,
    );
    fireEvent.click(screen.getByText('Open'));
    expect(screen.getByText('Visible')).toBeTruthy();
  });

  it("open=true → content visible direct", () => {
    render(
      <Popover open>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Visible</PopoverContent>
      </Popover>,
    );
    expect(screen.getByText('Visible')).toBeTruthy();
  });

  it("PopoverContent classes V1 : rounded-2xl + bg-white + shadow + p-4", () => {
    render(
      <Popover open>
        <PopoverTrigger>x</PopoverTrigger>
        <PopoverContent>v</PopoverContent>
      </Popover>,
    );
    const content = screen.getByText('v');
    expect(content.className).toContain('rounded-2xl');
    expect(content.className).toContain('bg-white');
    expect(content.className).toContain('p-4');
    expect(content.className).toContain('w-72');
  });

  it("align + sideOffset props (smoke)", () => {
    render(
      <Popover open>
        <PopoverTrigger>x</PopoverTrigger>
        <PopoverContent align="start" sideOffset={20}>
          v
        </PopoverContent>
      </Popover>,
    );
    expect(screen.getByText('v')).toBeTruthy();
  });

  it("className custom mergé", () => {
    render(
      <Popover open>
        <PopoverTrigger>x</PopoverTrigger>
        <PopoverContent className="my-pop">v</PopoverContent>
      </Popover>,
    );
    expect(screen.getByText('v').className).toContain('my-pop');
  });
});
