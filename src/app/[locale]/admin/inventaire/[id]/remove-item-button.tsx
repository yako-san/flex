'use client';

import { useTransition } from 'react';
import { removeBdtItemAction } from '../actions';

export function RemoveItemButton({ itemId }: { itemId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm('Supprimer cet item ?')) return;
        startTransition(async () => {
          const r = await removeBdtItemAction(itemId);
          if (r?.error) alert(r.error);
        });
      }}
      title="Supprimer l'item"
      style={{
        background: 'transparent',
        color: pending ? '#aaa' : '#c62828',
        border: 0,
        cursor: pending ? 'wait' : 'pointer',
        fontSize: '0.85rem',
        padding: '0.2rem 0.4rem',
      }}
    >
      ✕
    </button>
  );
}
