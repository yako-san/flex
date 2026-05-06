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
          <label style={lbl}>Prénom *</label>
          <input name="prenom" defaultValue={v('prenom')} required style={inp} />
          {fe.prenom ? <Err msg={fe.prenom} /> : null}
        </div>
        <div>
          <label style={lbl}>Nom *</label>
          <input name="nom" defaultValue={v('nom')} required style={inp} />
          {fe.nom ? <Err msg={fe.nom} /> : null}
        </div>
      </div>

      <label style={lbl}>Surnom *</label>
      <input
        name="surnom"
        defaultValue={v('surnom')}
        placeholder="court, ex yako, J-F"
        required
        style={inp}
      />
      {fe.surnom ? <Err msg={fe.surnom} /> : null}

      <label style={lbl}>Rôle</label>
      <input name="role" defaultValue={v('role')} placeholder="Mécanicien" style={inp} />

      <div style={twoCol}>
        <div>
          <label style={lbl}>Indicatif</label>
          <input name="indicatif" defaultValue={v('indicatif') || '+1'} style={inp} />
        </div>
        <div>
          <label style={lbl}>Téléphone</label>
          <input name="telephone" defaultValue={v('telephone')} style={inp} />
        </div>
      </div>

      <label style={lbl}>Courriel</label>
      <input name="courriel" type="email" defaultValue={v('courriel')} style={inp} />
      {fe.courriel ? <Err msg={fe.courriel} /> : null}

      <label style={lbl}>Langue</label>
      <select name="lang" defaultValue={initial?.lang ?? 'fr-CA'} style={inp}>
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

      <label style={lbl}>Notes</label>
      <textarea
        name="notes"
        defaultValue={v('notes')}
        rows={3}
        style={{ ...inp, fontFamily: 'inherit', resize: 'vertical' }}
      />

      {state?.error ? <div style={errBox}>{state.error}</div> : null}

      <button type="submit" disabled={pending} style={btn(pending)}>
        {pending ? '…' : initial ? 'Enregistrer' : 'Créer le membre'}
      </button>
    </form>
  );
}

function Err({ msg }: { msg: string }) {
  return <div style={{ color: '#c62828', fontSize: '0.85rem', marginTop: '-0.6rem', marginBottom: '0.5rem' }}>{msg}</div>;
}

const lbl: React.CSSProperties = { display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#444', marginBottom: '0.3rem' };
const inp: React.CSSProperties = { width: '100%', padding: '0.5rem 0.6rem', fontSize: '0.95rem', border: '1px solid #ccc', borderRadius: 4, marginBottom: '0.85rem', background: 'white' };
const twoCol: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' };
const errBox: React.CSSProperties = { background: '#ffebee', border: '1px solid #f44336', color: '#c62828', padding: '0.6rem', borderRadius: 4, marginBottom: '0.75rem' };
const btn = (p: boolean): React.CSSProperties => ({ padding: '0.6rem 1.2rem', background: p ? '#999' : '#1a1a1a', color: 'white', border: 0, borderRadius: 4, cursor: p ? 'wait' : 'pointer', fontSize: '0.95rem' });
