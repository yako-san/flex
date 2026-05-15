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
      <div className="mb-4">
        <label className="label-system">Prénom *</label>
        <input name="prenom" defaultValue={v('prenom')} required className="input-system" />
        {fe.prenom ? <Err msg={fe.prenom} /> : null}
      </div>

      <div className="mb-4">
        <label className="label-system">Nom *</label>
        <input name="nom" defaultValue={v('nom')} required className="input-system" />
        {fe.nom ? <Err msg={fe.nom} /> : null}
      </div>

      <div className="mb-4">
        <label className="label-system">Indicatif</label>
        <input
          name="indicatif"
          defaultValue={v('indicatif') || '+1'}
          placeholder="+1"
          className="input-system"
          style={{ width: 80 }}
        />
      </div>

      <div className="mb-4">
        <label className="label-system">Téléphone</label>
        <input
          name="telephone"
          defaultValue={v('telephone')}
          placeholder="(514) 123-4567"
          className="input-system"
        />
      </div>

      <div className="mb-4">
        <label className="label-system">Courriel</label>
        <input
          name="courriel"
          type="email"
          defaultValue={v('courriel')}
          className="input-system"
        />
        {fe.courriel ? <Err msg={fe.courriel} /> : null}
      </div>

      <div className="mb-4">
        <label className="label-system">Communication préférée *</label>
        <select
          name="commPref"
          defaultValue={initial?.commPref ?? 'EMAIL'}
          className="input-system"
        >
          <option value="EMAIL">Courriel</option>
          <option value="SMS">SMS</option>
          <option value="TELEPHONE">Téléphone</option>
          <option value="AUCUN">Aucun</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="label-system">Langue *</label>
        <select name="lang" defaultValue={initial?.lang ?? 'fr-CA'} className="input-system">
          <option value="fr-CA">Français (CA)</option>
          <option value="en-CA">English (CA)</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="label-system">Source / Lead</label>
        <input
          name="lead"
          defaultValue={v('lead')}
          placeholder="ex: yako.cyclo, Cyclo Flex"
          className="input-system"
        />
      </div>

      <div className="mb-4">
        <label className="label-system">Remise par défaut (%)</label>
        <input
          name="remiseDefault"
          type="number"
          step="0.01"
          min="0"
          max="100"
          defaultValue={v('remiseDefault')}
          className="input-system"
          style={{ width: 120 }}
        />
      </div>

      <div className="mb-4">
        <label className="label-system">Notes</label>
        <textarea
          name="notes"
          defaultValue={v('notes')}
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
  return <div className="mt-1 text-xs text-red-600">{msg}</div>;
}
