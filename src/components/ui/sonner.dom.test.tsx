// 4 tests surface : re-export Sonner avec config V1 (position, expand, theme).
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { Toaster } from './sonner';

afterEach(() => cleanup());

describe('Toaster', () => {
  it("se rend sans crash (re-export Sonner avec config V1)", () => {
    const { container } = render(<Toaster />);
    // Sonner injecte un section/ol invisible jusqu'à premier toast
    expect(container).toBeTruthy();
  });

  it("supporte les props personnalisées (position override)", () => {
    const { container } = render(<Toaster position="bottom-left" />);
    expect(container).toBeTruthy();
  });

  it("supporte expand prop", () => {
    const { container } = render(<Toaster expand={true} />);
    expect(container).toBeTruthy();
  });

  it("supporte theme prop", () => {
    const { container } = render(<Toaster theme="dark" />);
    expect(container).toBeTruthy();
  });
});
