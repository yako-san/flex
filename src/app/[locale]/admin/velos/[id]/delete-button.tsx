'use client';

import { useTransition } from 'react';
import { deleteVeloAction } from '../actions';

type Props = {
  veloId: string;
  veloLabel: string;
  hasBdcs: boolean;
};

export function DeleteVeloButton({ veloId, veloLabel, hasBdcs }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (hasBdcs) {
          alert(`Impossible : ${veloLabel} a des BDT associés.`);
          return;
        }
        if (!confirm(`Supprimer ${veloLabel} ? (soft delete réversible)`)) return;
        startTransition(async () => {
          const result = await deleteVeloAction(veloId);
          if (result?.error) alert(result.error);
        });
      }}
      style={{ display: 'inline' }}
    >
      <button
        type="submit"
        disabled={pending || hasBdcs}
        title={hasBdcs ? 'Le vélo a des BDT associés' : 'Soft delete'}
        style={{
          padding: '0.4rem 0.9rem',
          background: 'transparent',
          color: hasBdcs ? '#aaa' : '#c62828',
          border: `1px solid ${hasBdcs ? '#ddd' : '#c62828'}`,
          borderRadius: 4,
          cursor: pending || hasBdcs ? 'not-allowed' : 'pointer',
          fontSize: '0.9rem',
        }}
      >
        {pending ? 'Suppression…' : 'Supprimer'}
      </button>
    </form>
  );
}
