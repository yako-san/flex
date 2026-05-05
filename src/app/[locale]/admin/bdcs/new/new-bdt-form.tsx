'use client';

import { useActionState } from 'react';
import { createBdtAction, type BdtFormState } from '../actions';

type Props = {
  velos: { id: string; label: string }[];
  defaultVeloId: string | null;
};

export function NewBdtForm({ velos, defaultVeloId }: Props) {
  const [state, formAction, pending] = useActionState<BdtFormState | null, FormData>(
    createBdtAction,
    null,
  );

  return (
    <form action={formAction}>
      <div style={rowStyle}>
        <label style={labelStyle}>Vélo *</label>
        <select
          name="veloId"
          defaultValue={defaultVeloId ?? ''}
          required
          style={inputStyle}
        >
          <option value="">— sélectionner un vélo —</option>
          {velos.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      <div style={twoColStyle}>
        <div>
          <label style={labelStyle}>Statut éval initial</label>
          <select name="evalStatus" defaultValue="EN_ATTENTE" style={inputStyle}>
            <option value="EN_ATTENTE">En attente</option>
            <option value="APPROUVE">Approuvé</option>
            <option value="REDUX">Redux</option>
            <option value="REFUSE">Refusé</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Statut archive</label>
          <select name="archiveStatus" defaultValue="ACTIF" style={inputStyle}>
            <option value="ACTIF">Actif</option>
            <option value="ARCHIVE_FACTURE">Archivé (facturé)</option>
            <option value="ARCHIVE_A_FACTURER">Archivé (à facturer)</option>
            <option value="ARCHIVE_REFUSE">Archivé (refusé)</option>
            <option value="ARCHIVE_CTRL_QLTE">Archivé (CTRL qualité)</option>
            <option value="ARCHIVE_EVAL">Archivé (éval seule)</option>
          </select>
        </div>
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>Notes initiales</label>
        <textarea
          name="notes"
          rows={4}
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
        {pending ? 'Création…' : 'Créer le BDT'}
      </button>
    </form>
  );
}

const rowStyle: React.CSSProperties = { marginBottom: '1rem' };
const twoColStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '1rem',
  marginBottom: '1rem',
};
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
