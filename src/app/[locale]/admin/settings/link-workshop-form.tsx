'use client';

import { useActionState } from 'react';
import { linkWorkshopToOrgAction } from './actions';

type Props = {
  workshopId: string;
  workshopName: string;
  clerkOrgId: string;
  clerkOrgSlug: string | null;
};

export function LinkWorkshopForm({
  workshopId,
  workshopName,
  clerkOrgId,
  clerkOrgSlug,
}: Props) {
  const [state, action, pending] = useActionState(linkWorkshopToOrgAction, null);

  if (state?.success) {
    return (
      <div
        style={{
          padding: '1rem',
          background: '#e8f5e9',
          border: '1px solid #4caf50',
          borderRadius: 4,
          color: '#2e7d32',
        }}
      >
        ✓ Workshop lié à l&apos;org. Recharge la page pour voir l&apos;état mis à jour.
      </div>
    );
  }

  return (
    <form action={action}>
      <input type="hidden" name="workshopId" value={workshopId} />
      <input type="hidden" name="clerkOrgId" value={clerkOrgId} />

      <div
        style={{
          padding: '1rem',
          background: '#fff8e1',
          border: '1px solid #ffc107',
          borderRadius: 4,
          marginBottom: '1rem',
        }}
      >
        <strong>Action requise :</strong> tu as une org Clerk active{' '}
        ({clerkOrgSlug ?? clerkOrgId}) mais le workshop <strong>{workshopName}</strong>{' '}
        n&apos;est lié à aucune org. Lier les deux ?
      </div>

      <button
        type="submit"
        disabled={pending}
        style={{
          padding: '0.6rem 1.2rem',
          fontSize: '0.95rem',
          background: pending ? '#999' : '#1a1a1a',
          color: 'white',
          border: 0,
          borderRadius: 4,
          cursor: pending ? 'wait' : 'pointer',
        }}
      >
        {pending ? 'Liaison…' : `Lier ${workshopName} à ${clerkOrgSlug ?? 'cette org'}`}
      </button>

      {state?.error ? (
        <p style={{ color: '#c62828', marginTop: '0.5rem', fontSize: '0.9rem' }}>
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
