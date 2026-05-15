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
        <label className="label-system">Pièce</label>
        <select name="pieceId" required className="input-system" defaultValue="">
          <option value="" disabled>— Choisir une pièce —</option>
          {pieces.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div style={{ width: 100 }}>
        <label className="label-system">Qté</label>
        <input
          name="qty"
          type="number"
          step="1"
          min="1"
          defaultValue="1"
          required
          className="input-system"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="btn-primary"
        style={{ height: 38 }}
      >
        {pending ? 'Ajout…' : '+ Ajouter'}
      </button>
      {state?.error ? (
        <div style={{ width: '100%' }} className="mt-1 text-xs text-red-600">{state.error}</div>
      ) : null}
    </form>
  );
}
