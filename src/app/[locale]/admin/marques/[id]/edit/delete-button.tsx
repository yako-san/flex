'use client';

import { useTransition } from 'react';
import { deleteMarqueAction } from '../../actions';

type Props = { marqueId: string; marqueName: string; hasVelos: boolean };

export function DeleteMarqueButton({ marqueId, marqueName, hasVelos }: Props) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending || hasVelos}
      title={hasVelos ? 'La marque a des vélos associés' : 'Soft delete'}
      onClick={() => {
        if (hasVelos) { alert(`Impossible : ${marqueName} a des vélos associés.`); return; }
        if (!confirm(`Supprimer ${marqueName} ?`)) return;
        start(async () => {
          const r = await deleteMarqueAction(marqueId);
          if (r?.error) alert(r.error);
        });
      }}
      style={{
        padding: '0.4rem 0.9rem',
        background: 'transparent',
        color: hasVelos ? '#aaa' : '#c62828',
        border: `1px solid ${hasVelos ? '#ddd' : '#c62828'}`,
        borderRadius: 4,
        cursor: pending || hasVelos ? 'not-allowed' : 'pointer',
        fontSize: '0.9rem',
      }}
    >
      {pending ? 'Suppression…' : 'Supprimer'}
    </button>
  );
}
