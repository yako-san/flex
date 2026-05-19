import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/dashboard',
}));

import { SidebarPreview } from './sidebar-preview';

describe('SidebarPreview', () => {
  it("rend 9 liens de navigation", () => {
    render(<SidebarPreview />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(9);
  });

  it("badge Inventaire = 7 visible", () => {
    render(<SidebarPreview />);
    expect(screen.getByText('7')).toBeTruthy();
  });

  it("badge Pièces = 49 visible", () => {
    render(<SidebarPreview />);
    expect(screen.getByText('49')).toBeTruthy();
  });

  it("version label visible", () => {
    render(<SidebarPreview />);
    expect(screen.getByText(/v2\.0\.0/)).toBeTruthy();
  });

  it("loginInitial 'yk' visible", () => {
    render(<SidebarPreview />);
    expect(screen.getByText('yk')).toBeTruthy();
  });
});
