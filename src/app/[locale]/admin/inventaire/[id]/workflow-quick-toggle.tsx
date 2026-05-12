'use client';

import { startTransition, useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { toast } from '@/lib/utils/toast';
import { cn } from '@/lib/utils';
import { patchBdtCheckboxAction } from '../../bdcs/actions';

type CheckboxKey = 'cbEvalEnvoye' | 'cbEval' | 'cbBonSortie' | 'cbArchiver';

type Props = {
  bdcId: string;
  initial: Record<CheckboxKey, boolean>;
};

const LABELS: Record<CheckboxKey, string> = {
  cbEvalEnvoye: 'Évaluation envoyée',
  cbEval: 'Éval. validée',
  cbBonSortie: 'Bon de sortie',
  cbArchiver: 'Archiver',
};

export function WorkflowQuickToggles({ bdcId, initial }: Props) {
  const router = useRouter();
  const [pending, startSave] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic<Record<CheckboxKey, boolean>>(initial);

  const toggle = (key: CheckboxKey) => {
    const newValue = !optimistic[key];
    startSave(async () => {
      startTransition(() => setOptimistic({ ...optimistic, [key]: newValue }));
      const r = await patchBdtCheckboxAction(bdcId, key, newValue);
      if (r.error) {
        toast(r.error, 'error');
      } else {
        router.refresh();
      }
    });
  };

  return (
    <ul className="mb-3 space-y-1.5 text-xs">
      {(Object.keys(LABELS) as CheckboxKey[]).map((key) => {
        const checked = optimistic[key];
        return (
          <li key={key}>
            <button
              type="button"
              onClick={() => toggle(key)}
              disabled={pending}
              className="flex w-full items-center gap-2 rounded text-left transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              <span
                aria-hidden
                className={cn(
                  'inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border-2 border-current',
                  checked && 'bg-current',
                )}
              >
                {checked ? <Check size={10} className="text-white mix-blend-difference" /> : null}
              </span>
              <span className={cn(checked ? 'font-semibold' : 'opacity-70')}>{LABELS[key]}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
