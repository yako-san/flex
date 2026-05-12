'use client';

import { useEffect, useRef, useState } from 'react';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface UseDebouncedAutosaveOptions {
  delay?: number;
  enabled?: boolean;
  savedDuration?: number;
}

export interface UseDebouncedAutosaveResult {
  status: AutosaveStatus;
  error: unknown;
  flush: () => Promise<void>;
}

export function useDebouncedAutosave<T>(
  value: T,
  save: (v: T) => Promise<void>,
  { delay = 500, enabled = true, savedDuration = 1500 }: UseDebouncedAutosaveOptions = {},
): UseDebouncedAutosaveResult {
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const [error, setError] = useState<unknown>(null);
  const initRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const valueRef = useRef(value);
  const saveRef = useRef(save);

  valueRef.current = value;
  saveRef.current = save;

  const run = async (): Promise<void> => {
    setStatus('saving');
    setError(null);
    try {
      await saveRef.current(valueRef.current);
      setStatus('saved');
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setStatus('idle'), savedDuration);
    } catch (e) {
      setError(e);
      setStatus('error');
    }
  };

  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      return;
    }
    if (!enabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void run(), delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, enabled, delay]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const flush = async (): Promise<void> => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    await run();
  };

  return { status, error, flush };
}
