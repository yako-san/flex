'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { TrashIcon } from '@/components/icons';
import { customConfirm } from '@/components/ui/confirm-dialog';
import { toast } from '@/lib/utils/toast';
import { deleteVeloAction } from '../actions';

type Props = {
  veloId: string;
  veloLabel: string;
  hasBdcs: boolean;
};

export function DeleteVeloButton({ veloId, veloLabel, hasBdcs }: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handleClick = async () => {
    if (hasBdcs) {
      toast(`Impossible : ${veloLabel} a des BDT associés.`, 'error');
      return;
    }
    const ok = await customConfirm({
      title: `Supprimer ${veloLabel} ?`,
      message: 'Action réversible (soft delete) — restaurable via Maintenance.',
      confirmLabel: 'Supprimer',
      variant: 'danger',
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await deleteVeloAction(veloId);
      if (result?.error) {
        toast(result.error, 'error');
      } else {
        toast(`${veloLabel} supprimé`, 'success');
        router.refresh();
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending || hasBdcs}
      title={hasBdcs ? 'Le vélo a des BDT associés' : 'Soft delete'}
      className="inline-flex h-8 items-center gap-1 rounded-full border-2 border-[var(--rouge)] px-3 text-xs font-semibold uppercase tracking-wider text-[var(--rouge)] transition-colors hover:bg-[var(--rouge)]/10 disabled:cursor-not-allowed disabled:border-[var(--gris-bord)] disabled:text-[var(--text-secondary-50)] disabled:hover:bg-transparent"
    >
      <TrashIcon width={14} height={14} />
      {pending ? 'Suppression…' : 'Supprimer'}
    </button>
  );
}
