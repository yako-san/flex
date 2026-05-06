'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adjustStockAction, type AdjustState } from '../../actions';

type Props = {
  pieceId: string;
  currentStock: number;
};

export function AdjustStockForm({ pieceId, currentStock }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<AdjustState | null, FormData>(adjustStockAction, null);
  const [delta, setDelta] = useState('');

  useEffect(() => {
    if (state?.success) {
      router.refresh();
      setDelta('');
    }
  }, [state, router]);

  const newStock = currentStock + (Number(delta) || 0);

  return (
    <form action={formAction} style={{ background: '#fafafa', border: '1px solid #e0e0e0', borderRadius: 6, padding: '1rem' }}>
      <input type="hidden" name="pieceId" value={pieceId} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '0.75rem', alignItems: 'end' }}>
        <div>
          <label style={lbl}>Delta (+/-)</label>
          <input
            name="delta"
            type="number"
            step="1"
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            placeholder="ex +5 ou -2"
            required
            style={inp}
          />
        </div>
        <div>
          <label style={lbl}>Raison (audit trail)</label>
          <input name="reason" required placeholder="ex inventaire physique, perte, retour..." style={inp} />
        </div>
        <button type="submit" disabled={pending} style={btn(pending)}>
          {pending ? '…' : 'Ajuster'}
        </button>
      </div>
      {delta && Number(delta) !== 0 ? (
        <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
          Nouveau stock : <strong>{newStock}</strong> (était {currentStock})
        </p>
      ) : null}
      {state?.error ? (
        <div style={{ color: '#c62828', fontSize: '0.85rem', marginTop: '0.5rem' }}>{state.error}</div>
      ) : null}
      {state?.success ? (
        <div style={{ color: '#2e7d32', fontSize: '0.85rem', marginTop: '0.5rem' }}>✓ Mouvement enregistré</div>
      ) : null}
    </form>
  );
}

const lbl: React.CSSProperties = { display: 'block', fontSize: '0.78rem', color: '#666', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' };
const inp: React.CSSProperties = { width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.9rem', border: '1px solid #ccc', borderRadius: 4, background: 'white' };
const btn = (p: boolean): React.CSSProperties => ({ padding: '0.45rem 1rem', background: p ? '#999' : '#1565c0', color: 'white', border: 0, borderRadius: 4, cursor: p ? 'wait' : 'pointer', fontSize: '0.9rem', height: '2.1rem' });
