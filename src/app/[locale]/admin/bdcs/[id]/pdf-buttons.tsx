'use client';

import { useState, useTransition } from 'react';
import { emitFactureAction } from './emit-facture-action';

type Props = {
  bdcId: string;
  existingFactureLogId: string | null;
  existingFactureNumero: string | null;
};

export function PdfButtons({
  bdcId,
  existingFactureLogId,
  existingFactureNumero,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [emitted, setEmitted] = useState<{ id: string; numero: string } | null>(
    existingFactureLogId && existingFactureNumero
      ? { id: existingFactureLogId, numero: existingFactureNumero }
      : null,
  );
  const [error, setError] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <a
        href={`/api/admin/bdcs/${bdcId}/eval.pdf`}
        target="_blank"
        rel="noopener noreferrer"
        style={btnLink}
      >
        📄 Évaluation (PDF)
      </a>
      <a
        href={`/api/admin/bdcs/${bdcId}/bon-sortie.pdf`}
        target="_blank"
        rel="noopener noreferrer"
        style={btnLink}
      >
        🧾 Bon de sortie (PDF)
      </a>

      {emitted ? (
        <a
          href={`/api/admin/factures/${emitted.id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...btnLink, background: '#e8f5e9', borderColor: '#2e7d32', color: '#2e7d32' }}
        >
          💰 Facture {emitted.numero}
        </a>
      ) : (
        <FactureEmitForm
          bdcId={bdcId}
          pending={pending}
          onEmit={(mode) => {
            setError(null);
            startTransition(async () => {
              const r = await emitFactureAction(bdcId, mode);
              if (r.error) {
                setError(r.error);
                return;
              }
              if (r.factureLogId && r.factureNumero) {
                setEmitted({ id: r.factureLogId, numero: r.factureNumero });
              }
            });
          }}
        />
      )}

      {error ? (
        <div style={{ color: '#c62828', fontSize: '0.85rem' }}>{error}</div>
      ) : null}
    </div>
  );
}

function FactureEmitForm({
  bdcId: _bdcId,
  pending,
  onEmit,
}: {
  bdcId: string;
  pending: boolean;
  onEmit: (mode: 'COMPTANT' | 'INTERAC' | 'CARTE' | 'AUTRE' | null) => void;
}) {
  const [mode, setMode] = useState<'COMPTANT' | 'INTERAC' | 'CARTE' | 'AUTRE' | ''>('');
  return (
    <div style={{ background: '#fafafa', border: '1px solid #e0e0e0', borderRadius: 4, padding: '0.6rem' }}>
      <div style={{ fontSize: '0.78rem', color: '#666', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Émettre la facture
      </div>
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as 'COMPTANT' | 'INTERAC' | 'CARTE' | 'AUTRE' | '')}
        style={{
          width: '100%',
          padding: '0.4rem 0.5rem',
          fontSize: '0.85rem',
          border: '1px solid #ccc',
          borderRadius: 4,
          background: 'white',
          marginBottom: '0.4rem',
        }}
      >
        <option value="">— Mode de paiement —</option>
        <option value="COMPTANT">Comptant</option>
        <option value="INTERAC">Interac</option>
        <option value="CARTE">Carte</option>
        <option value="AUTRE">Autre</option>
      </select>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm('Émettre la facture ? Action immutable (numéro séquentiel attribué).')) return;
          onEmit(mode === '' ? null : mode);
        }}
        style={{
          width: '100%',
          padding: '0.45rem 0.9rem',
          background: pending ? '#999' : '#2e7d32',
          color: 'white',
          border: 0,
          borderRadius: 4,
          cursor: pending ? 'wait' : 'pointer',
          fontSize: '0.85rem',
          fontWeight: 600,
        }}
      >
        {pending ? 'Émission…' : '💰 Émettre la facture'}
      </button>
    </div>
  );
}

const btnLink: React.CSSProperties = {
  display: 'block',
  padding: '0.45rem 0.9rem',
  border: '1px solid #1565c0',
  color: '#1565c0',
  textDecoration: 'none',
  borderRadius: 4,
  fontSize: '0.85rem',
  textAlign: 'center',
  background: 'white',
};
