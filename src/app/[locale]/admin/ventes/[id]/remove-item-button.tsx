'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { removeVenteItemAction } from '../actions';

export function RemoveItemButton({ itemId }: { itemId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm('Retirer cet item ?')) return;
        start(async () => {
          const r = await removeVenteItemAction(itemId);
          if (r.error) alert(r.error);
          else router.refresh();
        });
      }}
      style={{
        padding: '0.3rem 0.6rem',
        background: 'transparent',
        color: '#c62828',
        border: '1px solid #ef9a9a',
        borderRadius: 4,
        cursor: pending ? 'wait' : 'pointer',
        fontSize: '0.8rem',
      }}
    >
      {pending ? '…' : '✕'}
    </button>
  );
}
