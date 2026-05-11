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
      style={{
        display: 'grid',
        gridTemplateColumns: '120px 1fr 80px auto',
        gap: '0.5rem',
        alignItems: 'end',
        background: '#fafafa',
        padding: '0.75rem',
        borderRadius: 4,
        border: '1px solid #e0e0e0',
        marginBottom: '1rem',
      }}
    >
      <input type="hidden" name="bdcId" value={bdcId} />

      <div>
        <label style={labelStyle}>Type</label>
        <select
          name="kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as 'SERVICE' | 'PIECE' | 'FORFAIT')}
          style={inputStyle}
        >
          <option value="SERVICE">Service</option>
          <option value="PIECE">Pièce</option>
          <option value="FORFAIT">Forfait</option>
        </select>
      </div>

      <div>
        <label style={labelStyle}>
          {kind === 'SERVICE' ? 'Service' : kind === 'PIECE' ? 'Pièce' : 'Forfait'} *
        </label>
        <select name="refId" required style={inputStyle} key={kind}>
          <option value="">— choisir —</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>Qté</label>
        <input
          name="qty"
          type="number"
          step="0.01"
          min="0.01"
          defaultValue="1"
          style={inputStyle}
        />
      </div>

      <button type="submit" disabled={pending} style={btnStyle(pending)}>
        {pending ? '…' : '+ Ajouter'}
      </button>

      {state?.error ? (
        <div
          style={{
            gridColumn: '1 / -1',
            color: '#c62828',
            fontSize: '0.85rem',
            marginTop: '0.25rem',
          }}
        >
          {state.error}
          {state.fieldErrors
            ? ` — ${Object.values(state.fieldErrors).join(', ')}`
            : null}
        </div>
      ) : null}
    </form>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 500,
  color: '#666',
  marginBottom: '0.2rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.4rem 0.5rem',
  fontSize: '0.9rem',
  border: '1px solid #ccc',
  borderRadius: 4,
  background: 'white',
};
const btnStyle = (pending: boolean): React.CSSProperties => ({
  padding: '0.45rem 0.9rem',
  fontSize: '0.9rem',
  background: pending ? '#999' : '#1a1a1a',
  color: 'white',
  border: 0,
  borderRadius: 4,
  cursor: pending ? 'wait' : 'pointer',
  height: '2.1rem',
  alignSelf: 'end',
});
