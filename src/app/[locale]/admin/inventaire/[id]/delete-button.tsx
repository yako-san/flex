'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { customConfirm } from '@/components/ui/confirm-dialog';
import { toast } from '@/lib/utils/toast';
import { deleteBdtAction } from '../actions';

type Props = { bdcId: string };

export function DeleteBdtButton({ bdcId }: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handleClick = async () => {
    const ok = await customConfirm({
      title: 'Supprimer ce BDT ?',
      message: 'Le bon de travail sera archivé (soft delete) — il pourra être restauré via Maintenance.',
      confirmLabel: 'Supprimer',
      variant: 'danger',
    });
    if (!ok) return;
    startTransition(async () => {
      const r = await deleteBdtAction(bdcId);
      if (r?.error) {
        toast(r.error, 'error');
      } else {
        toast('BDT supprimé', 'success');
        router.refresh();
      }
    });
  };

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      className="inline-flex h-8 items-center gap-1 rounded-full border-2 border-[var(--rouge)] px-3 text-xs font-semibold uppercase tracking-wider text-[var(--rouge)] transition-colors hover:bg-[var(--rouge)]/10 disabled:opacity-50"
    >
      <Trash2 size={14} />
      {pending ? 'Suppression…' : 'Supprimer'}
    </button>
  );
}
