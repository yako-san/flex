'use client';

import { useActionState } from 'react';
import { createVenteAction, type VenteFormState } from '../actions';

type Client = { id: string; prenom: string; nom: string };
type Props = { clients: Client[] };

export function VenteForm({ clients }: Props) {
  const [state, formAction, pending] = useActionState<VenteFormState | null, FormData>(
    createVenteAction,
    null,
  );

  return (
    <form action={formAction} style={{ maxWidth: 600 }}>
      <div style={rowStyle}>
        <label style={labelStyle}>Client (optionnel — sinon walk-in)</label>
        <select name="clientId" defaultValue="" style={inputStyle}>
          <option value="">— Aucun (walk-in) —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.prenom} {c.nom}
            </option>
          ))}
        </select>
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>Notes</label>
        <textarea
          name="notes"
          rows={3}
          style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
        />
      </div>

      {state?.error ? (
        <div
          style={{
            background: '#ffebee',
            border: '1px solid #f44336',
            color: '#c62828',
            padding: '0.75rem',
            borderRadius: 4,
            marginBottom: '1rem',
          }}
        >
          {state.error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        style={{
          padding: '0.7rem 1.5rem',
          fontSize: '0.95rem',
          background: pending ? '#999' : '#1a1a1a',
          color: 'white',
          border: 0,
          borderRadius: 4,
          cursor: pending ? 'wait' : 'pointer',
        }}
      >
        {pending ? 'Création…' : 'Créer la vente'}
      </button>
    </form>
  );
}

const rowStyle: React.CSSProperties = { marginBottom: '1rem' };
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
};
