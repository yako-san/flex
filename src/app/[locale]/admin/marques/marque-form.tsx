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
      <label style={lbl}>Nom *</label>
      <input name="nom" defaultValue={initial?.nom ?? ''} required style={inp} />
      {fe.nom ? <div style={err}>{fe.nom}</div> : null}

      <label style={lbl}>
        Tailles disponibles (séparées par virgule)
      </label>
      <input
        name="taillesDisponibles"
        defaultValue={taillesDefault}
        placeholder="XS, S, M, L, XL  ou  48, 51, 54, 57"
        style={inp}
      />
      <p style={{ color: '#888', fontSize: '0.78rem', marginTop: '-0.5rem', marginBottom: '0.85rem' }}>
        Affichées comme dropdown dans le formulaire vélo. Laisse vide si la
        marque ne suit pas un standard.
      </p>

      {state?.error ? <div style={errBox}>{state.error}</div> : null}
      <button type="submit" disabled={pending} style={btn(pending)}>
        {pending ? '…' : initial ? 'Enregistrer' : 'Créer la marque'}
      </button>
    </form>
  );
}

const lbl: React.CSSProperties = { display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#444', marginBottom: '0.3rem' };
const inp: React.CSSProperties = { width: '100%', padding: '0.5rem 0.6rem', fontSize: '0.95rem', border: '1px solid #ccc', borderRadius: 4, marginBottom: '0.85rem' };
const err: React.CSSProperties = { color: '#c62828', fontSize: '0.85rem', marginTop: '-0.5rem', marginBottom: '0.5rem' };
const errBox: React.CSSProperties = { background: '#ffebee', border: '1px solid #f44336', color: '#c62828', padding: '0.6rem', borderRadius: 4, marginBottom: '0.75rem' };
const btn = (p: boolean): React.CSSProperties => ({ padding: '0.6rem 1.2rem', background: p ? '#999' : '#1a1a1a', color: 'white', border: 0, borderRadius: 4, cursor: p ? 'wait' : 'pointer', fontSize: '0.95rem' });
