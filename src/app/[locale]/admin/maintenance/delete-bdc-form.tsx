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
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={labelStyle}>ID du BDT à supprimer (ex: bdc_01HXY...)</label>
        <input name="bdcId" required style={inputStyle} placeholder="bdc_..." />
      </div>
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={labelStyle}>
          Tape <code>SUPPRIMER</code> (en majuscules) pour confirmer
        </label>
        <input name="confirmation" required style={inputStyle} placeholder="SUPPRIMER" />
      </div>

      {state?.error ? (
        <div style={{ background: '#ffebee', border: '1px solid #f44336', color: '#c62828', padding: '0.6rem', borderRadius: 4, marginBottom: '0.75rem', fontSize: '0.9rem' }}>
          {state.error}
        </div>
      ) : null}
      {state?.success ? (
        <div style={{ background: '#e8f5e9', border: '1px solid #2e7d32', color: '#1b5e20', padding: '0.6rem', borderRadius: 4, marginBottom: '0.75rem', fontSize: '0.9rem' }}>
          ✓ {state.success}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        style={{
          padding: '0.55rem 1.1rem',
          background: pending ? '#999' : '#c62828',
          color: 'white',
          border: 0,
          borderRadius: 4,
          cursor: pending ? 'wait' : 'pointer',
          fontSize: '0.9rem',
        }}
      >
        {pending ? 'Suppression…' : 'Supprimer le BDT'}
      </button>
    </form>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 500,
  color: '#444',
  marginBottom: '0.3rem',
};
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.6rem',
  fontSize: '0.95rem',
  border: '1px solid #ccc',
  borderRadius: 4,
  background: 'white',
  fontFamily: 'monospace',
};
