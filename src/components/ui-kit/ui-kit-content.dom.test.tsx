import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('next/navigation', () => ({
  usePathname: () => '/fr-CA/admin/settings/ui-kit',
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/lib/utils/toast', () => ({ toast: vi.fn() }));
vi.mock('@/components/ui/confirm-dialog', () => ({
  customConfirm: vi.fn().mockResolvedValue(true),
}));

import { UiKitContent } from './ui-kit-content';

describe('UiKitContent', () => {
  it("PageHeader avec titre 'UI Kit' visible", () => {
    render(<UiKitContent />);
    expect(screen.getByText('UI Kit')).toBeTruthy();
  });

  it("section 'Boutons' avec variants Primary, Secondary, Danger visibles", () => {
    render(<UiKitContent />);
    expect(screen.getByText('Enregistrer')).toBeTruthy();
    expect(screen.getByText('Annuler')).toBeTruthy();
    expect(screen.getByText('Supprimer')).toBeTruthy();
  });

  it("section 'Tokens couleurs' visible", () => {
    render(<UiKitContent />);
    expect(screen.getByText(/Tokens couleurs/)).toBeTruthy();
  });

  it("section Sidebar (preview) rendue", () => {
    render(<UiKitContent />);
    expect(screen.getByText('Sidebar (preview encadré)')).toBeTruthy();
  });

  it("eyebrow par défaut 'dev · qa visuelle'", () => {
    render(<UiKitContent />);
    expect(screen.getByText(/dev · qa visuelle/)).toBeTruthy();
  });

  it("eyebrow personnalisé affiché", () => {
    render(<UiKitContent eyebrow="settings · test" />);
    expect(screen.getByText('settings · test')).toBeTruthy();
  });
});
