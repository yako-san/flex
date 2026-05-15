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
      <div className="mb-4">
        <label className="label-system">Client (optionnel — sinon walk-in)</label>
        <select name="clientId" defaultValue="" className="input-system">
          <option value="">— Aucun (walk-in) —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.prenom} {c.nom}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="label-system">Notes</label>
        <textarea
          name="notes"
          rows={3}
          className="input-system"
        />
      </div>

      {state?.error ? (
        <div className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? 'Création…' : 'Créer la vente'}
      </button>
    </form>
  );
}
