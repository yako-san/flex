'use client';

import { useTransition } from 'react';
import { X } from 'lucide-react';
import { customConfirm } from '@/components/ui/confirm-dialog';
import { toast } from '@/lib/utils/toast';
import { removeBdtItemAction } from '../actions';

export function RemoveItemButton({ itemId }: { itemId: string }) {
  const [pending, startTransition] = useTransition();

  const handleClick = async () => {
    const ok = await customConfirm({
      title: 'Supprimer cet item ?',
      confirmLabel: 'Supprimer',
      variant: 'danger',
    });
    if (!ok) return;
    startTransition(async () => {
      const r = await removeBdtItemAction(itemId);
      if (r?.error) toast(r.error, 'error');
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      title="Supprimer l'item"
      className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[var(--rouge)] transition-colors hover:bg-[var(--rouge)]/10 disabled:opacity-40"
    >
      <X size={14} />
    </button>
  );
}
