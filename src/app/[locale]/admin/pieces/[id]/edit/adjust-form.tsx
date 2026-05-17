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
    <form action={formAction} className="rounded-xl border border-[var(--gris-bord)] bg-white/60 p-4">
      <input type="hidden" name="pieceId" value={pieceId} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '0.75rem', alignItems: 'end' }}>
        <div>
          <label className="label-system">Delta (+/-)</label>
          <input
            name="delta"
            type="number"
            step="1"
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            placeholder="ex +5 ou -2"
            required
            className="input-system"
          />
        </div>
        <div>
          <label className="label-system">Raison (audit trail)</label>
          <input name="reason" required placeholder="ex inventaire physique, perte, retour..." className="input-system" />
        </div>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? '…' : 'Ajuster'}
        </button>
      </div>
      {delta && Number(delta) !== 0 ? (
        <p className="text-sm text-[var(--text-secondary-60)]" style={{ marginTop: '0.5rem' }}>
          Nouveau stock : <strong>{newStock}</strong> (était {currentStock})
        </p>
      ) : null}
      {state?.error ? (
        <div className="mt-2 text-xs text-red-600">{state.error}</div>
      ) : null}
      {state?.success ? (
        <div className="mt-2 text-xs text-green-700">✓ Mouvement enregistré</div>
      ) : null}
    </form>
  );
}
