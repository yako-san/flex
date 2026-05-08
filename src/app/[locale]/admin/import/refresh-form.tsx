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
      <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
        Refresh partiel (workshop existant)
      </h2>
      <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
        Si le workshop est déjà importé et que tu veux juste hydrater les{' '}
        <strong>nouveaux champs du dump 1.1.0+</strong>{' '}
        (templates courriels, tailles vélo, paramètres v1) sans toucher aux
        clients/vélos/BDT déjà en place, utilise ce bouton. Ne crée pas de
        doublon, ne supprime rien.
      </p>
      <form action={formAction} style={{ marginBottom: '1.5rem' }}>
        <input
          type="file"
          name="dump"
          accept="application/json,.json"
          required
          style={{ marginBottom: '0.75rem' }}
        />
        <br />
        <button
          type="submit"
          disabled={pending}
          style={{
            padding: '0.6rem 1.2rem',
            background: pending ? '#999' : '#1565c0',
            color: 'white',
            border: 0,
            borderRadius: 4,
            cursor: pending ? 'wait' : 'pointer',
            fontSize: '0.95rem',
          }}
        >
          {pending ? 'Refresh…' : '🔄 Hydrater les nouveaux champs (sans toucher au reste)'}
        </button>

        {state?.error ? (
          <div
            style={{
              background: '#ffebee',
              border: '1px solid #f44336',
              color: '#c62828',
              padding: '0.75rem',
              borderRadius: 4,
              marginTop: '1rem',
            }}
          >
            {state.error}
          </div>
        ) : null}

        {state?.ok && state.details ? (
          <div
            style={{
              background: '#e8f5e9',
              border: '1px solid #2e7d32',
              color: '#1b5e20',
              padding: '0.75rem',
              borderRadius: 4,
              marginTop: '1rem',
              fontSize: '0.9rem',
            }}
          >
            ✓ Refresh terminé (schema {state.details.schemaVersion ?? '?'})<br />
            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
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
