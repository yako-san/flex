'use client';

import { useActionState, useState } from 'react';
import { addBdtItemAction, type BdtFormState } from '../actions';

type RefOption = { id: string; label: string };

type Props = {
  bdcId: string;
  services: RefOption[];
  pieces: RefOption[];
  forfaits: RefOption[];
};

export function AddItemForm({ bdcId, services, pieces, forfaits }: Props) {
  const [kind, setKind] = useState<'SERVICE' | 'PIECE' | 'FORFAIT'>('SERVICE');
  const [state, formAction, pending] = useActionState<BdtFormState | null, FormData>(
    addBdtItemAction,
    null,
  );

  const options = kind === 'SERVICE' ? services : kind === 'PIECE' ? pieces : forfaits;

  return (
    <form
      action={formAction}
      className="mb-4 rounded-xl border border-[var(--gris-bord)] bg-white/60 p-3"
      style={{
        display: 'grid',
        gridTemplateColumns: '120px 1fr 80px auto',
        gap: '0.5rem',
        alignItems: 'end',
      }}
    >
      <input type="hidden" name="bdcId" value={bdcId} />

      <div>
        <label className="label-system">Type</label>
        <select
          name="kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as 'SERVICE' | 'PIECE' | 'FORFAIT')}
          className="input-system"
        >
          <option value="SERVICE">Service</option>
          <option value="PIECE">Pièce</option>
          <option value="FORFAIT">Forfait</option>
        </select>
      </div>

      <div>
        <label className="label-system">
          {kind === 'SERVICE' ? 'Service' : kind === 'PIECE' ? 'Pièce' : 'Forfait'} *
        </label>
        <select name="refId" required className="input-system" key={kind}>
          <option value="">— choisir —</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label-system">Qté</label>
        <input
          name="qty"
          type="number"
          step="0.01"
          min="0.01"
          defaultValue="1"
          className="input-system"
        />
      </div>

      <button type="submit" disabled={pending} className="btn-primary" style={{ height: '2.1rem', alignSelf: 'end' }}>
        {pending ? '…' : '+ Ajouter'}
      </button>

      {state?.error ? (
        <div className="mt-1 text-xs text-red-600" style={{ gridColumn: '1 / -1' }}>
          {state.error}
          {state.fieldErrors
            ? ` — ${Object.values(state.fieldErrors).join(', ')}`
            : null}
        </div>
      ) : null}
    </form>
  );
}
