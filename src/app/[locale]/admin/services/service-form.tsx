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
      <label className="label-system">Libellé canonique *</label>
      <input
        name="labelCanonical"
        defaultValue={v('labelCanonical')}
        placeholder='ex "🧰 Install. : 2 pneus"'
        required
        className="input-system"
      />
      {fe.labelCanonical ? <Err msg={fe.labelCanonical} /> : null}

      <label className="label-system">Code legacy (v1)</label>
      <input
        name="legacyCode"
        defaultValue={v('legacyCode')}
        placeholder="ex S00001"
        className="input-system"
      />

      <div style={twoCol}>
        <div>
          <label className="label-system">Catégorie</label>
          <input name="categorie" defaultValue={v('categorie')} placeholder="Forfaits / Services - À la carte" className="input-system" />
        </div>
        <div>
          <label className="label-system">Catégorie prio (pour matching pièces)</label>
          <input name="categoriePrio" defaultValue={v('categoriePrio')} placeholder="2. Transmission, Chaines" className="input-system" />
        </div>
      </div>

      <div style={twoCol}>
        <div>
          <label className="label-system">Durée (minutes)</label>
          <input
            name="dureeMinutes"
            type="number"
            min="0"
            defaultValue={v('dureeMinutes')}
            className="input-system"
          />
        </div>
        <div>
          <label className="label-system">Prix HT *</label>
          <input
            name="prix"
            type="number"
            step="0.01"
            min="0"
            defaultValue={v('prix')}
            required
            className="input-system"
          />
          {fe.prix ? <Err msg={fe.prix} /> : null}
        </div>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
        <input type="checkbox" name="taxable" defaultChecked={initial?.taxable ?? true} />
        <span>Taxable (TPS + TVQ appliquées)</span>
      </label>

      {state?.error ? <div style={errBox}>{state.error}</div> : null}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? '…' : initial ? 'Enregistrer' : 'Créer le service'}
      </button>
    </form>
  );
}

function Err({ msg }: { msg: string }) {
  return <div style={{ color: '#c62828', fontSize: '0.85rem', marginTop: '-0.6rem', marginBottom: '0.5rem' }}>{msg}</div>;
}

const twoCol: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' };
const errBox: React.CSSProperties = { background: '#ffebee', border: '1px solid #f44336', color: '#c62828', padding: '0.6rem', borderRadius: 4, marginBottom: '0.75rem' };
