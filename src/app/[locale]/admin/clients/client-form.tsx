'use client';

import { useActionState } from 'react';
import {
  createClientAction,
  updateClientAction,
  type ClientFormState,
} from './actions';
import type { Client } from '@prisma/client';

type Props = {
  initial?: Client;
};

export function ClientForm({ initial }: Props) {
  const action = initial
    ? updateClientAction.bind(null, initial.id)
    : createClientAction;
  const [state, formAction, pending] = useActionState<ClientFormState | null, FormData>(
    action,
    null,
  );

  const fe = state?.fieldErrors ?? {};
  const v = (k: keyof Client) =>
    initial && (initial[k] as unknown as string | null | number | undefined) != null
      ? String(initial[k])
      : '';

  return (
    <form action={formAction} style={{ maxWidth: 600 }}>
      <div style={rowStyle}>
        <label style={labelStyle}>Prénom *</label>
        <input name="prenom" defaultValue={v('prenom')} required style={inputStyle} />
        {fe.prenom ? <Err msg={fe.prenom} /> : null}
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>Nom *</label>
        <input name="nom" defaultValue={v('nom')} required style={inputStyle} />
        {fe.nom ? <Err msg={fe.nom} /> : null}
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>Indicatif</label>
        <input
          name="indicatif"
          defaultValue={v('indicatif') || '+1'}
          placeholder="+1"
          style={{ ...inputStyle, width: 80 }}
        />
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>Téléphone</label>
        <input
          name="telephone"
          defaultValue={v('telephone')}
          placeholder="(514) 123-4567"
          style={inputStyle}
        />
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>Courriel</label>
        <input
          name="courriel"
          type="email"
          defaultValue={v('courriel')}
          style={inputStyle}
        />
        {fe.courriel ? <Err msg={fe.courriel} /> : null}
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>Communication préférée *</label>
        <select
          name="commPref"
          defaultValue={initial?.commPref ?? 'EMAIL'}
          style={inputStyle}
        >
          <option value="EMAIL">Courriel</option>
          <option value="SMS">SMS</option>
          <option value="TELEPHONE">Téléphone</option>
          <option value="AUCUN">Aucun</option>
        </select>
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>Langue *</label>
        <select name="lang" defaultValue={initial?.lang ?? 'fr-CA'} style={inputStyle}>
          <option value="fr-CA">Français (CA)</option>
          <option value="en-CA">English (CA)</option>
        </select>
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>Source / Lead</label>
        <input
          name="lead"
          defaultValue={v('lead')}
          placeholder="ex: yako.cyclo, Cyclo Flex"
          style={inputStyle}
        />
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>Remise par défaut (%)</label>
        <input
          name="remiseDefault"
          type="number"
          step="0.01"
          min="0"
          max="100"
          defaultValue={v('remiseDefault')}
          style={{ ...inputStyle, width: 120 }}
        />
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>Notes</label>
        <textarea
          name="notes"
          defaultValue={v('notes')}
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

      <button type="submit" disabled={pending} style={btnStyle(pending)}>
        {pending
          ? initial
            ? 'Mise à jour…'
            : 'Création…'
          : initial
          ? 'Enregistrer'
          : 'Créer le client'}
      </button>
    </form>
  );
}

function Err({ msg }: { msg: string }) {
  return <div style={{ color: '#c62828', fontSize: '0.85rem', marginTop: '0.25rem' }}>{msg}</div>;
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
const btnStyle = (pending: boolean): React.CSSProperties => ({
  padding: '0.7rem 1.5rem',
  fontSize: '0.95rem',
  background: pending ? '#999' : '#1a1a1a',
  color: 'white',
  border: 0,
  borderRadius: 4,
  cursor: pending ? 'wait' : 'pointer',
});
