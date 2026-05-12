// @vitest-environment happy-dom

import { act, render, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebouncedAutosave } from './use-debounced-autosave';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useDebouncedAutosave', () => {
  it('ne sauvegarde pas au premier render (skip initial)', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    renderHook(() => useDebouncedAutosave('initial', save));

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(save).not.toHaveBeenCalled();
  });

  it('déclenche save après le délai debounce sur changement de valeur', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(({ value }) => useDebouncedAutosave(value, save, { delay: 500 }), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });

    // Avant le délai : pas d'appel
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(save).not.toHaveBeenCalled();

    // Après le délai : appel avec la valeur courante
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith('b');
  });

  it('reset le timer si la valeur change pendant le debounce', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(({ value }) => useDebouncedAutosave(value, save, { delay: 500 }), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    rerender({ value: 'c' });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    // 300+300 = 600ms mais avec reset au 300ème → encore 200ms à attendre.
    expect(save).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith('c');
  });

  it("ne déclenche pas save quand enabled=false", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      ({ value }) => useDebouncedAutosave(value, save, { delay: 100, enabled: false }),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(save).not.toHaveBeenCalled();
  });

  it('expose un état "saving" pendant le save puis "saved"', async () => {
    vi.useRealTimers();
    let resolveSave!: () => void;
    const save = vi.fn().mockImplementation(
      () => new Promise<void>((resolve) => { resolveSave = resolve; }),
    );

    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedAutosave(value, save, { delay: 10, savedDuration: 50 }),
      { initialProps: { value: 'a' } },
    );

    expect(result.current.status).toBe('idle');

    rerender({ value: 'b' });

    // Attend le debounce + entrée dans saving
    await waitFor(() => expect(result.current.status).toBe('saving'), { timeout: 200 });

    // Résout le save côté serveur
    await act(async () => {
      resolveSave();
    });
    await waitFor(() => expect(result.current.status).toBe('saved'), { timeout: 200 });

    // Après savedDuration, retour à 'idle'
    await waitFor(() => expect(result.current.status).toBe('idle'), { timeout: 200 });
  });

  it('expose un état "error" si save throw', async () => {
    vi.useRealTimers();
    const save = vi.fn().mockRejectedValue(new Error('boom'));
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedAutosave(value, save, { delay: 10 }),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });

    await waitFor(() => expect(result.current.status).toBe('error'), { timeout: 200 });
    expect((result.current.error as Error).message).toBe('boom');
  });

  it('flush() force le save immédiatement et résout', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedAutosave(value, save, { delay: 10_000 }),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });
    // Avant flush : rien
    expect(save).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.flush();
    });

    expect(save).toHaveBeenCalledWith('b');
  });

  it('nettoie le timer au démontage', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { rerender, unmount } = renderHook(
      ({ value }) => useDebouncedAutosave(value, save, { delay: 500 }),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });
    unmount();

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(save).not.toHaveBeenCalled();
  });
});

// Wrapper de test minimal pour éviter le warning React act() sur les
// rerenders synchrones — ce n'est pas utilisé ici mais c'est la convention
// pour les futurs tests qui composent useDebouncedAutosave dans un vrai
// composant.
export function _TestProbe() {
  return render(<div />);
}
