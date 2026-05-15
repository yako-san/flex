import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('./photo-actions', () => ({
  uploadBdcPhotoAction: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock('@/lib/utils/toast', () => ({ toast: vi.fn() }));

import { BdcPhotoUpload } from './photo-upload';

describe('BdcPhotoUpload', () => {
  it("zone drop visible avec texte 'Glisse une image ici'", () => {
    render(<BdcPhotoUpload bdcId="bdc1" />);
    expect(screen.getByText(/Glisse une image ici/)).toBeTruthy();
  });

  it("input file sr-only avec accept image/* et multiple", () => {
    const { container } = render(<BdcPhotoUpload bdcId="bdc1" />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.multiple).toBe(true);
    expect(input.getAttribute('accept')).toContain('image/jpeg');
    expect(input.className).toContain('sr-only');
  });

  it("formats acceptés mentionnés dans l'UI", () => {
    render(<BdcPhotoUpload bdcId="bdc1" />);
    expect(screen.getByText(/JPG, PNG, WebP/)).toBeTruthy();
  });

  it("au mount, file d'attente vide → pas de bouton téléverser", () => {
    render(<BdcPhotoUpload bdcId="bdc1" />);
    expect(screen.queryByRole('button', { name: /Téléverser/ })).toBeNull();
  });
});
