'use client';

import { useActionState } from 'react';
import { deleteBdcByIdAction, type MaintenanceState } from './actions';

export function DeleteBdcForm() {
  const [state, formAction, pending] = useActionState<MaintenanceState | null, FormData>(
    deleteBdcByIdAction,
    null,
  );

  return (
    <form action={formAction}>
      <div className="mb-3">
        <label className="label-system">ID du BDT à supprimer (ex: bdc_01HXY...)</label>
        <input name="bdcId" required className="input-system font-mono" placeholder="bdc_..." />
      </div>
      <div className="mb-3">
        <label className="label-system">
          Tape <code>SUPPRIMER</code> (en majuscules) pour confirmer
        </label>
        <input name="confirmation" required className="input-system font-mono" placeholder="SUPPRIMER" />
      </div>

      {state?.error ? (
        <div className="mb-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}
      {state?.success ? (
        <div className="mb-3 rounded-xl border border-green-400 bg-green-50 p-3 text-sm text-green-800">
          ✓ {state.success}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="btn-primary"
        style={{ background: pending ? 'var(--text-secondary-50)' : 'var(--rouge)', color: '#fff' }}
      >
        {pending ? 'Suppression…' : 'Supprimer le BDT'}
      </button>
    </form>
  );
}
