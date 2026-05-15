'use client';

import { useActionState } from 'react';
import { createMarqueAction, updateMarqueAction, type MarqueFormState } from './actions';

type Props = {
  initial?: { id: string; nom: string; taillesDisponibles?: string[] };
};

export function MarqueForm({ initial }: Props) {
  const action = initial ? updateMarqueAction.bind(null, initial.id) : createMarqueAction;
  const [state, formAction, pending] = useActionState<MarqueFormState | null, FormData>(action, null);
  const fe = state?.fieldErrors ?? {};

  const taillesDefault = (initial?.taillesDisponibles ?? []).join(', ');

  return (
    <form action={formAction} style={{ maxWidth: 560 }}>
      <label className="label-system">Nom *</label>
      <input name="nom" defaultValue={initial?.nom ?? ''} required className="input-system" />
      {fe.nom ? <div style={err}>{fe.nom}</div> : null}

      <label className="label-system">
        Tailles disponibles (séparées par virgule)
      </label>
      <input
        name="taillesDisponibles"
        defaultValue={taillesDefault}
        placeholder="XS, S, M, L, XL  ou  48, 51, 54, 57"
        className="input-system"
      />
      <p style={{ color: '#888', fontSize: '0.78rem', marginTop: '-0.5rem', marginBottom: '0.85rem' }}>
        Affichées comme dropdown dans le formulaire vélo. Laisse vide si la
        marque ne suit pas un standard.
      </p>

      {state?.error ? <div style={errBox}>{state.error}</div> : null}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? '…' : initial ? 'Enregistrer' : 'Créer la marque'}
      </button>
    </form>
  );
}

const err: React.CSSProperties = { color: '#c62828', fontSize: '0.85rem', marginTop: '-0.5rem', marginBottom: '0.5rem' };
const errBox: React.CSSProperties = { background: '#ffebee', border: '1px solid #f44336', color: '#c62828', padding: '0.6rem', borderRadius: 4, marginBottom: '0.75rem' };
