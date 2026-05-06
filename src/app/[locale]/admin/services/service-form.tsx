'use client';

import { useActionState } from 'react';
import {
  createServiceAction,
  updateServiceAction,
  type ServiceFormState,
} from './actions';
import type { Service } from '@prisma/client';

type Props = { initial?: Service };

export function ServiceForm({ initial }: Props) {
  const action = initial
    ? updateServiceAction.bind(null, initial.id)
    : createServiceAction;
  const [state, formAction, pending] = useActionState<ServiceFormState | null, FormData>(action, null);
  const fe = state?.fieldErrors ?? {};
  const v = (k: keyof Service): string =>
    initial && initial[k] != null ? String(initial[k]) : '';

  return (
    <form action={formAction} style={{ maxWidth: 720 }}>
      <label style={lbl}>Libellé canonique *</label>
      <input
        name="labelCanonical"
        defaultValue={v('labelCanonical')}
        placeholder='ex "🧰 Install. : 2 pneus"'
        required
        style={inp}
      />
      {fe.labelCanonical ? <Err msg={fe.labelCanonical} /> : null}

      <label style={lbl}>Code legacy (v1)</label>
      <input
        name="legacyCode"
        defaultValue={v('legacyCode')}
        placeholder="ex S00001"
        style={inp}
      />

      <div style={twoCol}>
        <div>
          <label style={lbl}>Catégorie</label>
          <input name="categorie" defaultValue={v('categorie')} placeholder="Forfaits / Services - À la carte" style={inp} />
        </div>
        <div>
          <label style={lbl}>Catégorie prio (pour matching pièces)</label>
          <input name="categoriePrio" defaultValue={v('categoriePrio')} placeholder="2. Transmission, Chaines" style={inp} />
        </div>
      </div>

      <div style={twoCol}>
        <div>
          <label style={lbl}>Durée (minutes)</label>
          <input
            name="dureeMinutes"
            type="number"
            min="0"
            defaultValue={v('dureeMinutes')}
            style={inp}
          />
        </div>
        <div>
          <label style={lbl}>Prix HT *</label>
          <input
            name="prix"
            type="number"
            step="0.01"
            min="0"
            defaultValue={v('prix')}
            required
            style={inp}
          />
          {fe.prix ? <Err msg={fe.prix} /> : null}
        </div>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
        <input type="checkbox" name="taxable" defaultChecked={initial?.taxable ?? true} />
        <span>Taxable (TPS + TVQ appliquées)</span>
      </label>

      {state?.error ? <div style={errBox}>{state.error}</div> : null}

      <button type="submit" disabled={pending} style={btn(pending)}>
        {pending ? '…' : initial ? 'Enregistrer' : 'Créer le service'}
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
