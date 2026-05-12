'use client';

import { startTransition, useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pill } from '@/components/ui/pill';
import { toast } from '@/lib/utils/toast';
import { patchBdtEvalStatusAction } from '../../bdcs/actions';

type EvalStatus = 'INDECIS' | 'ATTENTE' | 'APPROUVE' | 'REDUX' | 'REFUSE';

const OPTIONS: { value: EvalStatus; label: string; variant: 'neutral' | 'attente' | 'approuve' | 'eval' | 'fini' }[] = [
  { value: 'INDECIS',  label: 'Indécis',  variant: 'neutral' },
  { value: 'ATTENTE',  label: 'Attente',  variant: 'attente' },
  { value: 'APPROUVE', label: 'Approuvé', variant: 'approuve' },
  { value: 'REDUX',    label: 'Redux',    variant: 'eval' },
  { value: 'REFUSE',   label: 'Refusé',   variant: 'fini' },
];

type Props = {
  bdcId: string;
  initial: EvalStatus;
};

export function EvalStatusPills({ bdcId, initial }: Props) {
  const router = useRouter();
  const [pending, startSave] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic<EvalStatus>(initial);

  const change = (value: EvalStatus) => {
    if (value === optimistic) return;
    startSave(async () => {
      startTransition(() => setOptimistic(value));
      const r = await patchBdtEvalStatusAction(bdcId, value);
      if (r.error) {
        toast(r.error, 'error');
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="flex flex-wrap gap-1">
      {OPTIONS.map((opt) => {
        const active = opt.value === optimistic;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => change(opt.value)}
            disabled={pending || active}
            className="transition-opacity disabled:cursor-default disabled:opacity-100 hover:opacity-80"
          >
            {active ? (
              <Pill variant={opt.variant} size="sm">{opt.label}</Pill>
            ) : (
              <span className="inline-flex items-center rounded-full bg-black/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-current opacity-60 hover:opacity-90">
                {opt.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
