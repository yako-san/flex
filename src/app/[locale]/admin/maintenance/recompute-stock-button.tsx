'use client';

import { useActionState } from 'react';
import { recomputeStockAction, type MaintenanceState } from './actions';

export function RecomputeStockButton() {
  const [state, formAction, pending] = useActionState<MaintenanceState | null, FormData>(
    () => recomputeStockAction(null),
    null,
  );

  return (
    <form action={formAction}>
      {state?.error ? (
        <div style={{ background: '#ffebee', color: '#c62828', padding: '0.6rem', borderRadius: 4, marginBottom: '0.75rem', fontSize: '0.9rem' }}>
          {state.error}
        </div>
      ) : null}
      {state?.success ? (
        <div style={{ background: '#e8f5e9', color: '#1b5e20', padding: '0.6rem', borderRadius: 4, marginBottom: '0.75rem', fontSize: '0.9rem' }}>
          ✓ {state.success}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        style={{
          padding: '0.55rem 1.1rem',
          background: pending ? '#999' : '#1565c0',
          color: 'white',
          border: 0,
          borderRadius: 4,
          cursor: pending ? 'wait' : 'pointer',
          fontSize: '0.9rem',
        }}
      >
        {pending ? 'Recalcul en cours…' : '🔄 Recalculer stockPhysique/stockReserve depuis les mouvements'}
      </button>
    </form>
  );
}
