'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { TrashIcon } from '@/components/icons';
import { customConfirm } from '@/components/ui/confirm-dialog';
import { toast } from '@/lib/utils/toast';
import { deleteClientAction } from '../actions';

type Props = {
  clientId: string;
  clientName: string;
  hasVelos: boolean;
};

export function DeleteClientButton({ clientId, clientName, hasVelos }: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handleClick = async () => {
    if (hasVelos) {
      toast(`Impossible de supprimer ${clientName} : des vélos sont associés.`, 'error');
      return;
    }
    const ok = await customConfirm({
      title: `Supprimer ${clientName} ?`,
      message: 'Action réversible (soft delete) — restaurable via Maintenance.',
      confirmLabel: 'Supprimer',
      variant: 'danger',
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await deleteClientAction(clientId);
      if (result?.error) {
        toast(result.error, 'error');
      } else {
        toast(`${clientName} supprimé`, 'success');
        router.refresh();
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending || hasVelos}
      title={hasVelos ? 'Le client a des vélos associés' : 'Soft delete'}
      className="inline-flex h-8 items-center gap-1 rounded-full border-2 border-[var(--rouge)] px-3 text-xs font-semibold uppercase tracking-wider text-[var(--rouge)] transition-colors hover:bg-[var(--rouge)]/10 disabled:cursor-not-allowed disabled:border-[var(--gris-bord)] disabled:text-[var(--text-secondary-50)] disabled:hover:bg-transparent"
    >
      <TrashIcon width={14} height={14} />
      {pending ? 'Suppression…' : 'Supprimer'}
    </button>
  );
}
