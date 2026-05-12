import { describe, expect, it } from 'vitest';
import { MAX_PHOTO_SIZE_BYTES, validatePhotoUpload } from './blob';

describe('validatePhotoUpload', () => {
  describe('MIME whitelist (Sprint 2.8)', () => {
    it('accepte JPEG', () => {
      expect(validatePhotoUpload({ mimeType: 'image/jpeg', sizeBytes: 1_000_000 })).toEqual({});
    });

    it('accepte PNG', () => {
      expect(validatePhotoUpload({ mimeType: 'image/png', sizeBytes: 500_000 })).toEqual({});
    });

    it('accepte WebP', () => {
      expect(validatePhotoUpload({ mimeType: 'image/webp', sizeBytes: 100_000 })).toEqual({});
    });

    it('accepte HEIC (iPhone)', () => {
      expect(validatePhotoUpload({ mimeType: 'image/heic', sizeBytes: 2_000_000 })).toEqual({});
    });

    it('accepte HEIF', () => {
      expect(validatePhotoUpload({ mimeType: 'image/heif', sizeBytes: 2_000_000 })).toEqual({});
    });

    it('refuse PDF', () => {
      const r = validatePhotoUpload({ mimeType: 'application/pdf', sizeBytes: 100_000 });
      expect(r.error).toBeDefined();
      expect(r.error).toContain('application/pdf');
    });

    it('refuse GIF (volontaire — pas dans la whitelist V1)', () => {
      const r = validatePhotoUpload({ mimeType: 'image/gif', sizeBytes: 100_000 });
      expect(r.error).toBeDefined();
      expect(r.error).toContain('image/gif');
    });

    it("refuse texte brut", () => {
      const r = validatePhotoUpload({ mimeType: 'text/plain', sizeBytes: 100 });
      expect(r.error).toBeDefined();
    });

    it("message d'erreur mentionne les formats acceptés", () => {
      const r = validatePhotoUpload({ mimeType: 'image/tiff', sizeBytes: 100_000 });
      expect(r.error).toContain('JPG');
      expect(r.error).toContain('PNG');
      expect(r.error).toContain('WebP');
      expect(r.error).toContain('HEIC');
    });
  });

  describe('limite de taille (10 Mo, convention V1)', () => {
    it('MAX_PHOTO_SIZE_BYTES = 10 MB', () => {
      expect(MAX_PHOTO_SIZE_BYTES).toBe(10 * 1024 * 1024);
    });

    it('refuse fichier > 10 Mo', () => {
      const r = validatePhotoUpload({
        mimeType: 'image/jpeg',
        sizeBytes: MAX_PHOTO_SIZE_BYTES + 1,
      });
      expect(r.error).toBeDefined();
      expect(r.error).toContain('Max 10 Mo');
    });

    it('rapporte la taille en MB dans le message', () => {
      const r = validatePhotoUpload({ mimeType: 'image/jpeg', sizeBytes: 12_500_000 });
      expect(r.error).toContain('11.9 Mo');
    });

    it('accepte fichier exactement à la limite max', () => {
      expect(
        validatePhotoUpload({ mimeType: 'image/jpeg', sizeBytes: MAX_PHOTO_SIZE_BYTES }),
      ).toEqual({});
    });

    it('accepte fichier juste sous la limite max', () => {
      expect(
        validatePhotoUpload({ mimeType: 'image/jpeg', sizeBytes: MAX_PHOTO_SIZE_BYTES - 1 }),
      ).toEqual({});
    });
  });

  describe('fichier vide ou négatif', () => {
    it('refuse fichier vide (0 byte)', () => {
      const r = validatePhotoUpload({ mimeType: 'image/jpeg', sizeBytes: 0 });
      expect(r.error).toBe('Fichier vide.');
    });

    it('refuse taille négative (impossible normalement)', () => {
      const r = validatePhotoUpload({ mimeType: 'image/jpeg', sizeBytes: -1 });
      expect(r.error).toBe('Fichier vide.');
    });
  });

  describe('ordre de priorité des erreurs', () => {
    it('MIME invalide est rapporté avant la taille (ordre lexical du code)', () => {
      // Fichier PDF de 100 Mo : on rapporte le MIME, pas la taille
      const r = validatePhotoUpload({ mimeType: 'application/pdf', sizeBytes: 100_000_000 });
      expect(r.error).toContain('application/pdf');
      expect(r.error).not.toContain('Mo');
    });
  });
});
