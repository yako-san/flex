'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Receipt } from 'lucide-react';
import { customConfirm } from '@/components/ui/confirm-dialog';
import { toast } from '@/lib/utils/toast';
import { emitVenteFactureAction } from '../actions';

type Mode = 'COMPTANT' | 'INTERAC' | 'CARTE' | 'AUTRE';

export function EmitFactureButton({ venteId, disabled }: { venteId: string; disabled: boolean }) {
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<Mode>('COMPTANT');
  const router = useRouter();

  const handleClick = async () => {
    const ok = await customConfirm({
      title: `Émettre la facture ?`,
      message: `Paiement ${mode.toLowerCase()}. Le stock physique des pièces sera décrémenté. Action irréversible.`,
      confirmLabel: 'Émettre',
      variant: 'default',
    });
    if (!ok) return;
    start(async () => {
      const r = await emitVenteFactureAction(venteId, mode);
      if (r.error) {
        toast(r.error, 'error');
      } else {
        toast('Facture émise', 'success');
        router.refresh();
      }
    });
  };

  return (
    <div className="flex items-center gap-1">
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as Mode)}
        disabled={pending || disabled}
        className="input-system"
        style={{ width: 'auto', padding: '0.4rem 0.6rem' }}
      >
        <option value="COMPTANT">Comptant</option>
        <option value="INTERAC">Interac</option>
        <option value="CARTE">Carte</option>
        <option value="AUTRE">Autre</option>
      </select>
      <button
        type="button"
        disabled={pending || disabled}
        onClick={handleClick}
        className="inline-flex h-8 items-center gap-1 rounded-full bg-[var(--st-approuve-bg)] px-3 text-xs font-bold uppercase tracking-wider text-black transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        <Receipt size={14} />
        {pending ? '…' : 'Émettre'}
      </button>
    </div>
  );
}
