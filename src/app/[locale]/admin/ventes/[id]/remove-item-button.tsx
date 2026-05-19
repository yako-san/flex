'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { XIcon } from '@/components/icons';
import { customConfirm } from '@/components/ui/confirm-dialog';
import { toast } from '@/lib/utils/toast';
import { removeVenteItemAction } from '../actions';

export function RemoveItemButton({ itemId }: { itemId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  const handleClick = async () => {
    const ok = await customConfirm({
      title: 'Retirer cet item ?',
      confirmLabel: 'Retirer',
      variant: 'danger',
    });
    if (!ok) return;
    start(async () => {
      const r = await removeVenteItemAction(itemId);
      if (r.error) {
        toast(r.error, 'error');
      } else {
        router.refresh();
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      title="Retirer l'item"
      aria-label="Retirer l'item de la vente"
      className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[var(--rouge)] transition-colors hover:bg-[var(--rouge)]/10 disabled:opacity-40"
    >
      <XIcon width={14} height={14} />
    </button>
  );
}
