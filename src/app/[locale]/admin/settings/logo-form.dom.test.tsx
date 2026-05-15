import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('./logo-actions', () => ({
  uploadLogoAction: vi.fn().mockResolvedValue(null),
  removeLogoAction: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/lib/utils/toast', () => ({ toast: vi.fn() }));
vi.mock('@/components/ui/confirm-dialog', () => ({
  customConfirm: vi.fn().mockResolvedValue(true),
}));

import { LogoForm } from './logo-form';

describe('LogoForm', () => {
  it("input file accept=image, required, name=logo", () => {
    const { container } = render(<LogoForm currentLogoBase64={null} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.required).toBe(true);
    expect(input.name).toBe('logo');
    expect(input.getAttribute('accept')).toContain('image/png');
  });

  it("bouton 'Téléverser' type=submit", () => {
    render(<LogoForm currentLogoBase64={null} />);
    const btn = screen.getByRole('button', { name: /Téléverser/ });
    expect(btn.getAttribute('type')).toBe('submit');
  });

  it("sans logo → label 'Choisir un fichier'", () => {
    render(<LogoForm currentLogoBase64={null} />);
    expect(screen.getByText(/Choisir un fichier/)).toBeTruthy();
  });

  it("avec logo → label 'Remplacer par' + img alt='Logo actuel'", () => {
    render(<LogoForm currentLogoBase64="data:image/png;base64,abc" />);
    expect(screen.getByText(/Remplacer par/)).toBeTruthy();
    expect(screen.getByAltText('Logo actuel')).toBeTruthy();
  });

  it("avec logo → bouton 'Supprimer' visible", () => {
    render(<LogoForm currentLogoBase64="data:image/png;base64,abc" />);
    expect(screen.getByRole('button', { name: /Supprimer/ })).toBeTruthy();
  });

  it("sans logo → pas de bouton Supprimer", () => {
    render(<LogoForm currentLogoBase64={null} />);
    expect(screen.queryByRole('button', { name: /Supprimer/ })).toBeNull();
  });

  it("au mount, pas de message erreur ni succès", () => {
    render(<LogoForm currentLogoBase64={null} />);
    expect(screen.queryByText(/✓/)).toBeNull();
  });
});
