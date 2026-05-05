'use client';

import { useTransition } from 'react';
import { deleteBdtAction } from '../actions';

type Props = { bdcId: string };

export function DeleteBdtButton({ bdcId }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm('Supprimer ce BDT ? (soft delete réversible)')) return;
        startTransition(async () => {
          const r = await deleteBdtAction(bdcId);
          if (r?.error) alert(r.error);
        });
      }}
      style={{
        padding: '0.4rem 0.9rem',
        background: 'transparent',
        color: '#c62828',
        border: '1px solid #c62828',
        borderRadius: 4,
        cursor: pending ? 'wait' : 'pointer',
        fontSize: '0.9rem',
      }}
    >
      {pending ? 'Suppression…' : 'Supprimer'}
    </button>
  );
}
