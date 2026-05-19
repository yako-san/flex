'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { TrashIcon } from '@/components/icons';
import { customConfirm } from '@/components/ui/confirm-dialog';
import { toast } from '@/lib/utils/toast';
import { deleteMarqueAction } from '../../actions';

type Props = { marqueId: string; marqueName: string; hasVelos: boolean };

export function DeleteMarqueButton({ marqueId, marqueName, hasVelos }: Props) {
  const [pending, start] = useTransition();
  const router = useRouter();

  const handleClick = async () => {
    if (hasVelos) {
      toast(`Impossible : ${marqueName} a des vélos associés.`, 'error');
      return;
    }
    const ok = await customConfirm({
      title: `Supprimer ${marqueName} ?`,
      message: 'Action réversible (soft delete).',
      confirmLabel: 'Supprimer',
      variant: 'danger',
    });
    if (!ok) return;
    start(async () => {
      const r = await deleteMarqueAction(marqueId);
      if (r?.error) {
        toast(r.error, 'error');
      } else {
        toast(`${marqueName} supprimée`, 'success');
        router.refresh();
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending || hasVelos}
      title={hasVelos ? 'La marque a des vélos associés' : 'Soft delete'}
      className="inline-flex h-8 items-center gap-1 rounded-full border-2 border-[var(--rouge)] px-3 text-xs font-semibold uppercase tracking-wider text-[var(--rouge)] transition-colors hover:bg-[var(--rouge)]/10 disabled:cursor-not-allowed disabled:border-[var(--gris-bord)] disabled:text-[var(--text-secondary-50)] disabled:hover:bg-transparent"
    >
      <TrashIcon width={14} height={14} />
      {pending ? 'Suppression…' : 'Supprimer'}
    </button>
  );
}
