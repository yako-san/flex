'use client';

import { useActionState, useState } from 'react';
import {
  createForfaitAction,
  updateForfaitAction,
  type ForfaitFormState,
} from './actions';
import type { Forfait } from '@prisma/client';

type Props = {
  initial?: Forfait;
  initialTasks?: { labelCanonical: string }[];
};

export function ForfaitForm({ initial, initialTasks = [] }: Props) {
  const action = initial
    ? updateForfaitAction.bind(null, initial.id)
    : createForfaitAction;
  const [state, formAction, pending] = useActionState<ForfaitFormState | null, FormData>(action, null);
  const [tasks, setTasks] = useState<string[]>(initialTasks.map((t) => t.labelCanonical));

  const fe = state?.fieldErrors ?? {};
  const v = (k: keyof Forfait): string =>
    initial && initial[k] != null ? String(initial[k]) : '';

  return (
    <form action={formAction} style={{ maxWidth: 720 }}>
      <label className="label-system">Libellé canonique *</label>
      <input
        name="labelCanonical"
        defaultValue={v('labelCanonical')}
        placeholder='ex "👌🏻 Forfait BASE — mise au point de sécurité"'
        required
        className="input-system"
      />
      {fe.labelCanonical ? <Err msg={fe.labelCanonical} /> : null}

      <label className="label-system">Code legacy (v1)</label>
      <input name="legacyCode" defaultValue={v('legacyCode')} placeholder="S00001" className="input-system" />

      <div style={twoCol}>
        <div>
          <label className="label-system">Durée (minutes)</label>
          <input name="dureeMinutes" type="number" min="0" defaultValue={v('dureeMinutes')} className="input-system" />
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
        <span>Taxable</span>
      </label>

      <h3 style={h3}>Sous-tâches du forfait</h3>
      <p style={{ fontSize: '0.78rem', color: '#888', marginTop: 0, marginBottom: '0.5rem' }}>
        Quand un BDT inclura ce forfait, ces sous-tâches seront créées
        automatiquement avec status TODO. Modifier ici n&apos;affecte pas les BDT existants
        (snapshot au moment de l&apos;ajout).
      </p>

      <div style={{ marginBottom: '0.85rem' }}>
        {tasks.map((t, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span style={{ alignSelf: 'center', color: '#888', fontSize: '0.85rem', width: 20 }}>
              {idx + 1}.
            </span>
            <input
              name="tasks"
              value={t}
              onChange={(e) =>
                setTasks((prev) => prev.map((x, i) => (i === idx ? e.target.value : x)))
              }
              placeholder="ex évaluation de l'état général du vélo"
              className="input-system"
              style={{ marginBottom: 0, flex: 1 }}
            />
            <button
              type="button"
              onClick={() => setTasks((prev) => prev.filter((_, i) => i !== idx))}
              className="btn-danger text-xs"
            >
              ✕
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setTasks((prev) => [...prev, ''])} className="btn-secondary text-xs">
          + Ajouter une sous-tâche
        </button>
      </div>

      {state?.error ? <div className="mb-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">{state.error}</div> : null}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? '…' : initial ? 'Enregistrer' : 'Créer le forfait'}
      </button>
    </form>
  );
}

function Err({ msg }: { msg: string }) {
  return <div style={{ color: '#c62828', fontSize: '0.85rem', marginTop: '-0.6rem', marginBottom: '0.5rem' }}>{msg}</div>;
}

const h3: React.CSSProperties = { fontSize: '1rem', marginTop: '1.5rem', marginBottom: '0.5rem', color: '#333' };
const twoCol: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' };
