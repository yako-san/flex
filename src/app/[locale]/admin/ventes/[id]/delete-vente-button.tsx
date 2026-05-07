'use client';

import { useTransition } from 'react';
import { deleteVenteAction } from '../actions';

export function DeleteVenteButton({ venteId }: { venteId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm('Supprimer cette vente brouillon ? (les items seront perdus)')) return;
        start(async () => {
          const r = await deleteVenteAction(venteId);
          if (r?.error) alert(r.error);
        });
      }}
      style={{
        padding: '0.55rem 0.9rem',
        background: 'transparent',
        color: '#c62828',
        border: '1px solid #ef9a9a',
        borderRadius: 4,
        cursor: pending ? 'wait' : 'pointer',
        fontSize: '0.9rem',
      }}
    >
      {pending ? '…' : 'Supprimer'}
    </button>
  );
}
