'use client';

import { useTransition } from 'react';
import { deleteClientAction } from '../actions';

type Props = {
  clientId: string;
  clientName: string;
  hasVelos: boolean;
};

export function DeleteClientButton({ clientId, clientName, hasVelos }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (hasVelos) {
          alert(`Impossible de supprimer ${clientName} : des vélos sont associés.`);
          return;
        }
        if (!confirm(`Supprimer ${clientName} ? (action réversible — soft delete)`)) return;
        startTransition(async () => {
          const result = await deleteClientAction(clientId);
          if (result?.error) alert(result.error);
        });
      }}
      style={{ display: 'inline' }}
    >
      <button
        type="submit"
        disabled={pending || hasVelos}
        title={hasVelos ? 'Le client a des vélos associés' : 'Soft delete'}
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
    </form>
  );
}
