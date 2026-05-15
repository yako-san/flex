'use client';

import { useActionState } from 'react';
import {
  createEquipeAction,
  updateEquipeAction,
  type EquipeFormState,
} from './actions';
import type { EquipeMember } from '@prisma/client';

type Props = { initial?: EquipeMember };

export function EquipeForm({ initial }: Props) {
  const action = initial
    ? updateEquipeAction.bind(null, initial.id)
    : createEquipeAction;
  const [state, formAction, pending] = useActionState<EquipeFormState | null, FormData>(action, null);
  const fe = state?.fieldErrors ?? {};
  const v = (k: keyof EquipeMember): string =>
    initial && initial[k] != null ? String(initial[k]) : '';

  return (
    <form action={formAction} style={{ maxWidth: 600 }}>
      <div style={twoCol}>
        <div>
          <label className="label-system">Prénom *</label>
          <input name="prenom" defaultValue={v('prenom')} required className="input-system" />
          {fe.prenom ? <Err msg={fe.prenom} /> : null}
        </div>
        <div>
          <label className="label-system">Nom *</label>
          <input name="nom" defaultValue={v('nom')} required className="input-system" />
          {fe.nom ? <Err msg={fe.nom} /> : null}
        </div>
      </div>

      <label className="label-system">Surnom *</label>
      <input
        name="surnom"
        defaultValue={v('surnom')}
        placeholder="court, ex yako, J-F"
        required
        className="input-system"
      />
      {fe.surnom ? <Err msg={fe.surnom} /> : null}

      <label className="label-system">Rôle</label>
      <input name="role" defaultValue={v('role')} placeholder="Mécanicien" className="input-system" />

      <div style={twoCol}>
        <div>
          <label className="label-system">Indicatif</label>
          <input name="indicatif" defaultValue={v('indicatif') || '+1'} className="input-system" />
        </div>
        <div>
          <label className="label-system">Téléphone</label>
          <input name="telephone" defaultValue={v('telephone')} className="input-system" />
        </div>
      </div>

      <label className="label-system">Courriel</label>
      <input name="courriel" type="email" defaultValue={v('courriel')} className="input-system" />
      {fe.courriel ? <Err msg={fe.courriel} /> : null}

      <label className="label-system">Langue</label>
      <select name="lang" defaultValue={initial?.lang ?? 'fr-CA'} className="input-system">
        <option value="fr-CA">Français (CA)</option>
        <option value="en-CA">English (CA)</option>
      </select>

      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
        <input
          type="checkbox"
          name="active"
          defaultChecked={initial?.active ?? true}
        />
        <span>Actif (peut être assigné aux BDT)</span>
      </label>

      <label className="label-system">Notes</label>
      <textarea
        name="notes"
        defaultValue={v('notes')}
        rows={3}
        className="input-system"
        style={{ fontFamily: 'inherit', resize: 'vertical' }}
      />

      {state?.error ? <div style={errBox}>{state.error}</div> : null}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? '…' : initial ? 'Enregistrer' : 'Créer le membre'}
      </button>
    </form>
  );
}

function Err({ msg }: { msg: string }) {
  return <div style={{ color: '#c62828', fontSize: '0.85rem', marginTop: '-0.6rem', marginBottom: '0.5rem' }}>{msg}</div>;
}

const twoCol: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' };
const errBox: React.CSSProperties = { background: '#ffebee', border: '1px solid #f44336', color: '#c62828', padding: '0.6rem', borderRadius: 4, marginBottom: '0.75rem' };
