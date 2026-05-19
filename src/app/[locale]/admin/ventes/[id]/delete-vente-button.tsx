'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { TrashIcon } from '@/components/icons';
import { customConfirm } from '@/components/ui/confirm-dialog';
import { toast } from '@/lib/utils/toast';
import { deleteVenteAction } from '../actions';

export function DeleteVenteButton({ venteId }: { venteId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  const handleClick = async () => {
    const ok = await customConfirm({
      title: 'Supprimer cette vente brouillon ?',
      message: 'Les items seront perdus. Action irréversible si la vente n\'a pas encore été facturée.',
      confirmLabel: 'Supprimer',
      variant: 'danger',
    });
    if (!ok) return;
    start(async () => {
      const r = await deleteVenteAction(venteId);
      if (r?.error) {
        toast(r.error, 'error');
      } else {
        toast('Vente supprimée', 'success');
        router.refresh();
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="inline-flex h-8 items-center gap-1 rounded-full border-2 border-[var(--rouge)] px-3 text-xs font-semibold uppercase tracking-wider text-[var(--rouge)] transition-colors hover:bg-[var(--rouge)]/10 disabled:opacity-50"
    >
      <TrashIcon width={14} height={14} />
      {pending ? '…' : 'Supprimer'}
    </button>
  );
}
