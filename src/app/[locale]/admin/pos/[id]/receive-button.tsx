'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { receivePoAction } from '../actions';

type Props = { poId: string; poNumero: string };

export function ReceivePoButton({ poId, poNumero }: Props) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Marquer ${poNumero} comme reçu ? Ça incrémentera le stock physique des pièces.`)) return;
        start(async () => {
          const r = await receivePoAction(poId);
          if (r.error) alert(r.error);
          else router.refresh();
        });
      }}
      style={{
        padding: '0.55rem 1.1rem',
        background: pending ? '#999' : '#2e7d32',
        color: 'white',
        border: 0,
        borderRadius: 4,
        cursor: pending ? 'wait' : 'pointer',
        fontSize: '0.95rem',
        fontWeight: 600,
      }}
    >
      {pending ? 'Réception…' : '📦 Marquer comme reçu'}
    </button>
  );
}
