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
      <div className="rounded-xl border border-green-300 bg-green-50 p-4 text-green-800">
        ✓ Workshop lié à l&apos;org. Recharge la page pour voir l&apos;état mis à jour.
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="workshopId" value={workshopId} />
      <input type="hidden" name="clerkOrgId" value={clerkOrgId} />

      <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4">
        <strong>Action requise :</strong> tu as une org Clerk active{' '}
        ({clerkOrgSlug ?? clerkOrgId}) mais le workshop <strong>{workshopName}</strong>{' '}
        n&apos;est lié à aucune org. Lier les deux ?
      </div>

      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? 'Liaison…' : `Lier ${workshopName} à ${clerkOrgSlug ?? 'cette org'}`}
      </button>

      {state?.error ? (
        <p className="mt-1 text-sm text-red-600">{state.error}</p>
      ) : null}
    </form>
  );
}
