'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { emitVenteFactureAction } from '../actions';

type Mode = 'COMPTANT' | 'INTERAC' | 'CARTE' | 'AUTRE';

export function EmitFactureButton({ venteId, disabled }: { venteId: string; disabled: boolean }) {
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<Mode>('COMPTANT');
  const router = useRouter();

  return (
    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as Mode)}
        disabled={pending || disabled}
        style={{
          padding: '0.5rem 0.6rem',
          fontSize: '0.9rem',
          border: '1px solid #ccc',
          borderRadius: 4,
          background: 'white',
        }}
      >
        <option value="COMPTANT">Comptant</option>
        <option value="INTERAC">Interac</option>
        <option value="CARTE">Carte</option>
        <option value="AUTRE">Autre</option>
      </select>
      <button
        type="button"
        disabled={pending || disabled}
        onClick={() => {
          if (!confirm(`Émettre la facture (paiement ${mode}) ? Action irréversible : stock sera décrémenté.`)) return;
          start(async () => {
            const r = await emitVenteFactureAction(venteId, mode);
            if (r.error) alert(r.error);
            else router.refresh();
          });
        }}
        style={{
          padding: '0.55rem 1.1rem',
          background: pending || disabled ? '#999' : '#2e7d32',
          color: 'white',
          border: 0,
          borderRadius: 4,
          cursor: pending || disabled ? 'not-allowed' : 'pointer',
          fontSize: '0.95rem',
          fontWeight: 600,
        }}
      >
        {pending ? 'Émission…' : '🧾 Émettre facture'}
      </button>
    </div>
  );
}
