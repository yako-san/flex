'use client';

import { useActionState } from 'react';
import { refreshFromDumpAction, type RefreshState } from './refresh-actions';

export function RefreshForm() {
  const [state, formAction, pending] = useActionState<RefreshState | null, FormData>(
    refreshFromDumpAction,
    null,
  );

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">
        Refresh partiel (workshop existant)
      </h2>
      <p className="mb-4 text-sm text-[var(--text-secondary-60)]">
        Si le workshop est déjà importé et que tu veux juste hydrater les{' '}
        <strong>nouveaux champs du dump 1.1.0+</strong>{' '}
        (templates courriels, tailles vélo, paramètres v1) sans toucher aux
        clients/vélos/BDT déjà en place, utilise ce bouton. Ne crée pas de
        doublon, ne supprime rien.
      </p>
      <form action={formAction} className="mb-6 flex flex-col gap-3">
        <input
          type="file"
          name="dump"
          accept="application/json,.json"
          required
          className="input-system"
        />
        <button type="submit" disabled={pending} className="btn-primary self-start">
          {pending ? 'Refresh…' : '🔄 Hydrater les nouveaux champs (sans toucher au reste)'}
        </button>

        {state?.error ? (
          <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {state.error}
          </div>
        ) : null}

        {state?.ok && state.details ? (
          <div className="rounded-xl border border-green-300 bg-green-50 p-3 text-sm text-green-800">
            ✓ Refresh terminé (schema {state.details.schemaVersion ?? '?'})<br />
            <ul className="mt-2 list-disc pl-5">
              <li>
                Templates courriels :{' '}
                {state.details.templatesUpdated ? '✓ hydratés' : '— rien à faire'}
              </li>
              <li>
                Tailles vélo : appliquées à <strong>{state.details.taillesAppliedToMarques}</strong> marque(s)
              </li>
              <li>
                Paramètres v1 :{' '}
                {state.details.parametresStored ? '✓ stockés dans legacyV1Extras' : '— absents du dump'}
              </li>
            </ul>
          </div>
        ) : null}
      </form>
    </div>
  );
}
