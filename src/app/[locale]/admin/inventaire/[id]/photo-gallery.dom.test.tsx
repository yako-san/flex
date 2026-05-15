import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('./photo-actions', () => ({
  deleteBdcPhotoAction: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock('@/lib/utils/toast', () => ({ toast: vi.fn() }));
vi.mock('@/components/ui/confirm-dialog', () => ({
  customConfirm: vi.fn().mockResolvedValue(true),
}));

import { BdcPhotoGallery, type BdcPhotoLite } from './photo-gallery';

const PHOTOS: BdcPhotoLite[] = [
  { id: 'ph1', blobUrl: 'https://cdn.example.com/ph1.jpg', caption: 'Avant réparation', kind: 'AVANT', position: 0 },
  { id: 'ph2', blobUrl: 'https://cdn.example.com/ph2.jpg', caption: null, kind: 'DEGAT', position: 1 },
];

describe('BdcPhotoGallery', () => {
  it("sans photos → message 'Aucune photo'", () => {
    render(<BdcPhotoGallery photos={[]} />);
    expect(screen.getByText(/Aucune photo/)).toBeTruthy();
  });

  it("avec photos → images rendues avec alt", () => {
    const { container } = render(<BdcPhotoGallery photos={PHOTOS} />);
    const imgs = container.querySelectorAll('img');
    expect(imgs.length).toBe(2);
    expect(imgs[0]!.getAttribute('alt')).toBe('Avant réparation');
  });

  it("badge kind affiché sur chaque photo", () => {
    render(<BdcPhotoGallery photos={PHOTOS} />);
    expect(screen.getByText('AVANT')).toBeTruthy();
    expect(screen.getByText('DEGAT')).toBeTruthy();
  });

  it("caption affichée pour photo avec caption", () => {
    render(<BdcPhotoGallery photos={PHOTOS} />);
    expect(screen.getByText('Avant réparation')).toBeTruthy();
  });

  it("bouton supprimer avec aria-label présent par photo", () => {
    const { container } = render(<BdcPhotoGallery photos={PHOTOS} />);
    const btns = container.querySelectorAll('[aria-label="Supprimer la photo"]');
    expect(btns.length).toBe(2);
  });

  it("clic sur photo → lightbox 'Photo agrandie' ouverte", () => {
    const { container } = render(<BdcPhotoGallery photos={PHOTOS} />);
    const thumbBtns = container.querySelectorAll('button[type="button"]');
    fireEvent.click(thumbBtns[0]!);
    expect(screen.getByRole('dialog', { name: /Photo agrandie/ })).toBeTruthy();
  });

  it("lightbox : bouton Fermer aria-label='Fermer'", () => {
    const { container } = render(<BdcPhotoGallery photos={PHOTOS} />);
    const thumbBtns = container.querySelectorAll('button[type="button"]');
    fireEvent.click(thumbBtns[0]!);
    expect(screen.getByRole('button', { name: 'Fermer' })).toBeTruthy();
  });
});
