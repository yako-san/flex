'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
    | 'remiseSvcType'
    | 'remiseSvcValue'
    | 'remisePceType'
    | 'remisePceValue'
    | 'avanceMontant'
    | 'avanceMode'
    | 'avanceNote'
    | 'noteClientEval'
    | 'noteClientFacture'
    | 'notes'
  >;
};

export function WorkflowForm({ bdc }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<BdtFormState | null, FormData>(
    updateBdtWorkflowAction,
    null,
  );

  // Refresh server data après un save réussi (sinon defaultValue gardé en UI).
  useEffect(() => {
    if (state && !state.error) router.refresh();
  }, [state, router]);

  return (
    <form action={formAction}>
      <input type="hidden" name="bdcId" value={bdc.id} />

      <div style={twoColStyle}>
        <div>
          <label style={labelStyle}>Statut éval</label>
          <select name="evalStatus" defaultValue={bdc.evalStatus} style={inputStyle}>
            <option value="INDECIS">Indécis</option>
            <option value="ATTENTE">En attente</option>
            <option value="APPROUVE">Approuvé</option>
            <option value="REDUX">Redux (partiel)</option>
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

      <h3 style={{ fontSize: '0.95rem', marginTop: '1rem', marginBottom: '0.5rem', color: '#444' }}>
        Remises
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <div>
          <label style={labelStyle}>Services</label>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <select name="remiseSvcType" defaultValue={bdc.remiseSvcType ?? ''} style={{ ...inputStyle, width: 80 }}>
              <option value="">—</option>
              <option value="PCT">%</option>
              <option value="FIXED">$</option>
            </select>
            <input
              name="remiseSvcValue"
              type="number"
              step="0.01"
              min="0"
              defaultValue={bdc.remiseSvcValue ? String(bdc.remiseSvcValue) : ''}
              placeholder="0"
              style={inputStyle}
            />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Pièces</label>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <select name="remisePceType" defaultValue={bdc.remisePceType ?? ''} style={{ ...inputStyle, width: 80 }}>
              <option value="">—</option>
              <option value="PCT">%</option>
              <option value="FIXED">$</option>
            </select>
            <input
              name="remisePceValue"
              type="number"
              step="0.01"
              min="0"
              defaultValue={bdc.remisePceValue ? String(bdc.remisePceValue) : ''}
              placeholder="0"
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      <h3 style={{ fontSize: '0.95rem', marginTop: '1rem', marginBottom: '0.5rem', color: '#444' }}>
        Avance / acompte client
      </h3>
      <p style={{ color: '#888', fontSize: '0.78rem', marginTop: 0, marginBottom: '0.4rem' }}>
        Acompte versé lors de l&apos;évaluation. N&apos;affecte pas les taxes — sert
        uniquement à afficher le « reste à payer » sur le PDF facture.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div>
          <label style={labelStyle}>Montant ($)</label>
          <input
            name="avanceMontant"
            type="number"
            step="0.01"
            min="0"
            defaultValue={bdc.avanceMontant ? String(bdc.avanceMontant) : ''}
            placeholder="0.00"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Mode</label>
          <select name="avanceMode" defaultValue={bdc.avanceMode ?? ''} style={inputStyle}>
            <option value="">—</option>
            <option value="COMPTANT">Comptant</option>
            <option value="INTERAC">Interac</option>
            <option value="CARTES">Carte</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Note (optionnel)</label>
          <input
            name="avanceNote"
            defaultValue={bdc.avanceNote ?? ''}
            placeholder="ex. acompte évaluation"
            style={inputStyle}
          />
        </div>
      </div>

      <h3 style={{ fontSize: '0.95rem', marginTop: '1rem', marginBottom: '0.5rem', color: '#444' }}>
        Notes client (visibles dans les PDFs et courriels)
      </h3>
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={labelStyle}>Note évaluation (PDF/courriel d&apos;éval)</label>
        <textarea
          name="noteClientEval"
          defaultValue={bdc.noteClientEval ?? ''}
          rows={3}
          placeholder="Précisions à transmettre au client lors de l'évaluation"
          style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
        />
      </div>
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={labelStyle}>Note facture (PDF/courriel de facture)</label>
        <textarea
          name="noteClientFacture"
          defaultValue={bdc.noteClientFacture ?? ''}
          rows={3}
          placeholder="Précisions à transmettre au client lors de la facturation"
          style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>Notes (interne)</label>
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
