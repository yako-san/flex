'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Package } from 'lucide-react';
import { customConfirm } from '@/components/ui/confirm-dialog';
import { toast } from '@/lib/utils/toast';
import { receivePoAction } from '../actions';

type Props = { poId: string; poNumero: string };

export function ReceivePoButton({ poId, poNumero }: Props) {
  const [pending, start] = useTransition();
  const router = useRouter();

  const handleClick = async () => {
    const ok = await customConfirm({
      title: `Marquer ${poNumero} comme reçu ?`,
      message: 'Le stock physique des pièces sera incrémenté. Action quasi-irréversible (impact stock).',
      confirmLabel: 'Marquer reçu',
    });
    if (!ok) return;
    start(async () => {
      const r = await receivePoAction(poId);
      if (r.error) {
        toast(r.error, 'error');
      } else {
        toast(`${poNumero} marqué reçu`, 'success');
        router.refresh();
      }
    });
  };

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      className="inline-flex h-9 items-center gap-2 rounded-full bg-[var(--st-approuve-bg)] px-4 text-xs font-bold uppercase tracking-wider text-black transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      <Package size={14} />
      {pending ? 'Réception…' : 'Marquer reçu'}
    </button>
  );
}
