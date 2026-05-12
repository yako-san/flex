// @vitest-environment happy-dom

import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock toast pour vérifier qu'il est appelé en cas d'erreur, sans pourrir
// le DOM avec un vrai Toaster sonner.
const toastCalls = vi.hoisted(() => ({
  info: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
}));
vi.mock('../lib/utils/toast', () => {
  const toast = Object.assign((msg: string, type?: string) => {
    const t = (type ?? 'info') as keyof typeof toastCalls;
    toastCalls[t]?.(msg);
  }, toastCalls);
  return { toast };
});

import { useOptimisticPatch } from './use-optimistic-patch';

beforeEach(() => {
  toastCalls.info.mockClear();
  toastCalls.success.mockClear();
  toastCalls.error.mockClear();
  toastCalls.warning.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

type Item = { id: string; label: string; qty: number };

describe('useOptimisticPatch', () => {
  it('applique l\'update optimistic immédiatement', async () => {
    const initial: Item[] = [
      { id: 'a', label: 'A', qty: 1 },
      { id: 'b', label: 'B', qty: 2 },
    ];
    const save = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useOptimisticPatch<Item>(initial, save));

    expect(result.current.items).toEqual(initial);

    await act(async () => {
      await result.current.patch('a', { qty: 99 });
    });

    expect(save).toHaveBeenCalledWith('a', { qty: 99 });
  });

  it('le save reçoit la clé + l\'update partiel', async () => {
    const initial: Item[] = [{ id: 'x', label: 'X', qty: 0 }];
    const save = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useOptimisticPatch<Item>(initial, save));

    await act(async () => {
      await result.current.patch('x', { label: 'New X' });
    });

    expect(save).toHaveBeenCalledWith('x', { label: 'New X' });
  });

  it('affiche un toast d\'erreur si save throw (errorMessage par défaut)', async () => {
    const initial: Item[] = [{ id: 'a', label: 'A', qty: 1 }];
    const save = vi.fn().mockRejectedValue(new Error('server boom'));

    const { result } = renderHook(() => useOptimisticPatch<Item>(initial, save));

    await act(async () => {
      try {
        await result.current.patch('a', { qty: 5 });
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(toastCalls.error).toHaveBeenCalled());
    expect(toastCalls.error).toHaveBeenCalledWith('Modification annulée');
  });

  it('respecte errorMessage custom', async () => {
    const initial: Item[] = [{ id: 'a', label: 'A', qty: 1 }];
    const save = vi.fn().mockRejectedValue(new Error('nope'));

    const { result } = renderHook(() =>
      useOptimisticPatch<Item>(initial, save, { errorMessage: 'Erreur custom' }),
    );

    await act(async () => {
      try {
        await result.current.patch('a', { qty: 5 });
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(toastCalls.error).toHaveBeenCalled());
    expect(toastCalls.error).toHaveBeenCalledWith('Erreur custom');
  });

  it('errorMessage=null → silencieux (pas de toast)', async () => {
    const initial: Item[] = [{ id: 'a', label: 'A', qty: 1 }];
    const save = vi.fn().mockRejectedValue(new Error('quiet'));

    const { result } = renderHook(() =>
      useOptimisticPatch<Item>(initial, save, { errorMessage: null }),
    );

    await act(async () => {
      try {
        await result.current.patch('a', { qty: 5 });
      } catch {
        // expected
      }
    });

    // Petit délai pour laisser un éventuel appel asynchrone échouer à throw
    await new Promise((r) => setTimeout(r, 50));
    expect(toastCalls.error).not.toHaveBeenCalled();
  });

  it('support keyField custom (ex: _row pour modèles V1)', async () => {
    type Row = { _row: number; nom: string };
    const initial: Row[] = [
      { _row: 1, nom: 'foo' },
      { _row: 2, nom: 'bar' },
    ];
    const save = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useOptimisticPatch<Row>(initial, save, { keyField: '_row' }),
    );

    await act(async () => {
      await result.current.patch(2, { nom: 'baz' });
    });

    expect(save).toHaveBeenCalledWith(2, { nom: 'baz' });
  });

  it('pending = true pendant le save, false après', async () => {
    const initial: Item[] = [{ id: 'a', label: 'A', qty: 1 }];
    let resolveSave!: () => void;
    const save = vi.fn().mockImplementation(
      () => new Promise<void>((r) => { resolveSave = r; }),
    );

    const { result } = renderHook(() => useOptimisticPatch<Item>(initial, save));

    expect(result.current.pending).toBe(false);

    const promise = act(async () => {
      await result.current.patch('a', { qty: 42 });
    });

    // Le save est en cours
    await waitFor(() => expect(result.current.pending).toBe(true));

    // Résoudre
    resolveSave();
    await promise;

    await waitFor(() => expect(result.current.pending).toBe(false));
  });
});
