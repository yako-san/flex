'use client';

import { useActionState } from 'react';
import { recomputeStockAction, type MaintenanceState } from './actions';

export function RecomputeStockButton() {
  const [state, formAction, pending] = useActionState<MaintenanceState | null, FormData>(
    () => recomputeStockAction(null),
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state?.error ? (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}
      {state?.success ? (
        <div className="rounded-xl border border-green-300 bg-green-50 p-3 text-sm text-green-800">
          ✓ {state.success}
        </div>
      ) : null}
      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? 'Recalcul en cours…' : '🔄 Recalculer stockPhysique/stockReserve depuis les mouvements'}
      </button>
    </form>
  );
}
