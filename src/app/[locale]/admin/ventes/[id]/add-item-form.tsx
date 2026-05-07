'use client';

import { useActionState } from 'react';
import { addVenteItemAction, type VenteFormState } from '../actions';

type Piece = { id: string; label: string };
type Props = { venteId: string; pieces: Piece[] };

export function AddItemForm({ venteId, pieces }: Props) {
  const [state, formAction, pending] = useActionState<VenteFormState | null, FormData>(
    addVenteItemAction,
    null,
  );

  return (
    <form action={formAction} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
      <input type="hidden" name="venteId" value={venteId} />
      <div style={{ flex: '1 1 360px', minWidth: 240 }}>
        <label style={labelStyle}>Pièce</label>
        <select name="pieceId" required style={inputStyle} defaultValue="">
          <option value="" disabled>— Choisir une pièce —</option>
          {pieces.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div style={{ width: 100 }}>
        <label style={labelStyle}>Qté</label>
        <input
          name="qty"
          type="number"
          step="1"
          min="1"
          defaultValue="1"
          required
          style={inputStyle}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        style={{
          padding: '0.55rem 1.1rem',
          background: pending ? '#999' : '#1a1a1a',
          color: 'white',
          border: 0,
          borderRadius: 4,
          cursor: pending ? 'wait' : 'pointer',
          fontSize: '0.95rem',
          height: 38,
        }}
      >
        {pending ? 'Ajout…' : '+ Ajouter'}
      </button>
      {state?.error ? (
        <div style={{ width: '100%', color: '#c62828', fontSize: '0.85rem' }}>{state.error}</div>
      ) : null}
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
};
