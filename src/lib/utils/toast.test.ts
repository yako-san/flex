import { afterEach, describe, expect, it, vi } from 'vitest';

// vi.hoisted permet de partager les mocks entre la définition `vi.mock` (qui
// est hoisted en haut du fichier) et les tests qui veulent vérifier les appels.
const sonnerCalls = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: sonnerCalls,
}));

import { toast } from './toast';

afterEach(() => {
  sonnerCalls.success.mockClear();
  sonnerCalls.error.mockClear();
  sonnerCalls.info.mockClear();
  sonnerCalls.warning.mockClear();
});

describe('toast wrapper', () => {
  it('toast(msg) défaut → sonner.info', () => {
    toast('hello');
    expect(sonnerCalls.info).toHaveBeenCalledWith('hello');
    expect(sonnerCalls.success).not.toHaveBeenCalled();
    expect(sonnerCalls.error).not.toHaveBeenCalled();
  });

  it("toast(msg, 'success') → sonner.success", () => {
    toast('Sauvegardé', 'success');
    expect(sonnerCalls.success).toHaveBeenCalledWith('Sauvegardé');
  });

  it("toast(msg, 'error') → sonner.error", () => {
    toast('Erreur', 'error');
    expect(sonnerCalls.error).toHaveBeenCalledWith('Erreur');
  });

  it("toast(msg, 'warning') → sonner.warning", () => {
    toast('Attention', 'warning');
    expect(sonnerCalls.warning).toHaveBeenCalledWith('Attention');
  });

  it("toast(msg, 'info') → sonner.info", () => {
    toast('Note', 'info');
    expect(sonnerCalls.info).toHaveBeenCalledWith('Note');
  });

  it('toast.success raccourci → sonner.success', () => {
    toast.success('OK');
    expect(sonnerCalls.success).toHaveBeenCalledWith('OK');
  });

  it('toast.error raccourci → sonner.error', () => {
    toast.error('KO');
    expect(sonnerCalls.error).toHaveBeenCalledWith('KO');
  });

  it('toast.warning raccourci → sonner.warning', () => {
    toast.warning('Attention');
    expect(sonnerCalls.warning).toHaveBeenCalledWith('Attention');
  });

  it('toast.info raccourci → sonner.info', () => {
    toast.info('Note');
    expect(sonnerCalls.info).toHaveBeenCalledWith('Note');
  });
});
