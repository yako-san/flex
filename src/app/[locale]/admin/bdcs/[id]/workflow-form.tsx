'use client';

import { useActionState } from 'react';
import { updateBdtWorkflowAction, type BdtFormState } from '../actions';
import type { Bdc } from '@prisma/client';

type Props = {
  bdc: Pick<
    Bdc,
    | 'id'
    | 'evalStatus'
    | 'archiveStatus'
    | 'cbEvalEnvoye'
    | 'cbEval'
    | 'cbBonSortie'
    | 'cbArchiver'
    | 'notes'
  >;
};

export function WorkflowForm({ bdc }: Props) {
  const [state, formAction, pending] = useActionState<BdtFormState | null, FormData>(
    updateBdtWorkflowAction,
    null,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="bdcId" value={bdc.id} />

      <div style={twoColStyle}>
        <div>
          <label style={labelStyle}>Statut éval</label>
          <select name="evalStatus" defaultValue={bdc.evalStatus} style={inputStyle}>
            <option value="EN_ATTENTE">En attente</option>
            <option value="APPROUVE">Approuvé</option>
            <option value="REDUX">Redux</option>
            <option value="REFUSE">Refusé</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Statut archive</label>
          <select name="archiveStatus" defaultValue={bdc.archiveStatus} style={inputStyle}>
            <option value="ACTIF">Actif</option>
            <option value="ARCHIVE_FACTURE">Archivé (facturé)</option>
            <option value="ARCHIVE_A_FACTURER">Archivé (à facturer)</option>
            <option value="ARCHIVE_REFUSE">Archivé (refusé)</option>
            <option value="ARCHIVE_CTRL_QLTE">Archivé (CTRL qualité)</option>
            <option value="ARCHIVE_EVAL">Archivé (éval seule)</option>
            <option value="ARCHIVE_LEGACY">Archivé (legacy v1)</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem 1rem', margin: '1rem 0' }}>
        <Checkbox name="cbEvalEnvoye" label="Éval envoyée client" defaultChecked={bdc.cbEvalEnvoye} />
        <Checkbox name="cbEval" label="Éval validée mécano" defaultChecked={bdc.cbEval} />
        <Checkbox name="cbBonSortie" label="Bon de sortie imprimé" defaultChecked={bdc.cbBonSortie} />
        <Checkbox name="cbArchiver" label="Archivage déclenché" defaultChecked={bdc.cbArchiver} />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>Notes</label>
        <textarea
          name="notes"
          defaultValue={bdc.notes ?? ''}
          rows={4}
          style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
        />
      </div>

      {state?.error ? (
        <div style={{ color: '#c62828', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
          {state.error}
        </div>
      ) : null}

      <button type="submit" disabled={pending} style={btnStyle(pending)}>
        {pending ? 'Mise à jour…' : 'Enregistrer le workflow'}
      </button>
    </form>
  );
}

function Checkbox({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      <span>{label}</span>
    </label>
  );
}

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
const twoColStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '1rem',
};
const btnStyle = (pending: boolean): React.CSSProperties => ({
  padding: '0.55rem 1.1rem',
  fontSize: '0.9rem',
  background: pending ? '#999' : '#1a1a1a',
  color: 'white',
  border: 0,
  borderRadius: 4,
  cursor: pending ? 'wait' : 'pointer',
});
