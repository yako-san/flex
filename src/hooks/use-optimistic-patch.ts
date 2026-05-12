'use client';

import { startTransition, useCallback, useOptimistic, useState } from 'react';
import { toast } from '../lib/utils/toast';

export type OptimisticKey = string | number;

export interface UseOptimisticPatchOptions {
  /** Texte du toast d'erreur. Si null, pas de toast (silencieux). */
  errorMessage?: string | null;
  /** Champ qui sert de clé d'identité (défaut: 'id'). Accepte '_row' pour les modèles V1. */
  keyField?: string;
}

export interface UseOptimisticPatchResult<T> {
  items: T[];
  patch: (key: OptimisticKey, updates: Partial<T>) => Promise<void>;
  pending: boolean;
}

interface OptimisticAction<T> {
  key: OptimisticKey;
  updates: Partial<T>;
  keyField: string;
}

export function useOptimisticPatch<T extends Record<string, unknown>>(
  initial: T[],
  saveAction: (key: OptimisticKey, updates: Partial<T>) => Promise<void>,
  { errorMessage = 'Modification annulée', keyField = 'id' }: UseOptimisticPatchOptions = {},
): UseOptimisticPatchResult<T> {
  const [pending, setPending] = useState(false);
  const [optimistic, applyOptimistic] = useOptimistic<T[], OptimisticAction<T>>(
    initial,
    (state, action) => state.map((item) =>
      item[action.keyField] === action.key ? ({ ...item, ...action.updates } as T) : item,
    ),
  );

  const patch = useCallback(
    async (key: OptimisticKey, updates: Partial<T>): Promise<void> => {
      setPending(true);
      try {
        await new Promise<void>((resolve, reject) => {
          startTransition(async () => {
            applyOptimistic({ key, updates, keyField });
            try {
              await saveAction(key, updates);
              resolve();
            } catch (e) {
              if (errorMessage) toast(errorMessage, 'error');
              reject(e);
            }
          });
        });
      } finally {
        setPending(false);
      }
    },
    [applyOptimistic, saveAction, errorMessage, keyField],
  );

  return { items: optimistic, patch, pending };
}
