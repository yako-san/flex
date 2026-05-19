'use client';

import { startTransition, useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckIcon } from '@/components/icons';
import { toast } from '@/lib/utils/toast';
import { cn } from '@/lib/utils';
import {
  patchBdtCheckboxAction,
  patchBdtEvalStatusAction,
} from '../../bdcs/actions';

type CheckboxKey = 'cbEvalEnvoye' | 'cbEval' | 'cbBonSortie' | 'cbArchiver';
type EvalStatus = 'INDECIS' | 'ATTENTE' | 'APPROUVE' | 'REDUX' | 'REFUSE';

const CHECKBOX_LABELS: Record<CheckboxKey, string> = {
  cbEvalEnvoye: 'Évaluation envoyée',
  cbEval: 'Éval. validée',
  cbBonSortie: 'Bon de sortie',
  cbArchiver: 'Archiver',
};

const EVAL_STATUS_OPTIONS: { value: EvalStatus; label: string; bg: string; fg: string }[] = [
  { value: 'INDECIS',  label: 'Indécis',  bg: 'rgba(0,0,0,0.10)',         fg: 'currentColor' },
  { value: 'ATTENTE',  label: 'Attente',  bg: 'var(--st-attente-bg)',     fg: 'var(--st-attente-fg)' },
  { value: 'APPROUVE', label: 'Approuvé', bg: 'var(--st-approuve-bg)',    fg: 'var(--st-approuve-fg)' },
  { value: 'REDUX',    label: 'Redux',    bg: 'var(--st-eval-bg)',        fg: 'var(--st-eval-fg)' },
  { value: 'REFUSE',   label: 'Refusé',   bg: 'var(--rouge)',             fg: '#fff' },
];

type Props = {
  bdcId: string;
  initialCheckboxes: Record<CheckboxKey, boolean>;
  initialEvalStatus: EvalStatus;
};

export function BdtAdvancement({ bdcId, initialCheckboxes, initialEvalStatus }: Props) {
  const router = useRouter();
  const [pending, startSave] = useTransition();
  const [boxes, setBoxes] = useOptimistic<Record<CheckboxKey, boolean>>(initialCheckboxes);
  const [evalStatus, setEvalStatus] = useOptimistic<EvalStatus>(initialEvalStatus);

  const toggle = (key: CheckboxKey) => {
    const newValue = !boxes[key];
    startSave(async () => {
      startTransition(() => setBoxes({ ...boxes, [key]: newValue }));
      const r = await patchBdtCheckboxAction(bdcId, key, newValue);
      if (r.error) {
        toast(r.error, 'error');
      } else {
        router.refresh();
      }
    });
  };

  const changeEval = (value: EvalStatus) => {
    if (value === evalStatus) return;
    startSave(async () => {
      startTransition(() => setEvalStatus(value));
      const r = await patchBdtEvalStatusAction(bdcId, value);
      if (r.error) {
        toast(r.error, 'error');
      } else {
        router.refresh();
      }
    });
  };

  return (
    <ul className="space-y-1.5 text-xs">
      {(Object.keys(CHECKBOX_LABELS) as CheckboxKey[]).map((key) => {
        const checked = boxes[key];
        return (
          <li key={key} className="space-y-1">
            <button
              type="button"
              onClick={() => toggle(key)}
              disabled={pending}
              className="flex w-full items-center gap-2 text-left transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              <span
                aria-hidden
                className={cn(
                  'inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border-2 border-current',
                  checked && 'bg-current',
                )}
              >
                {checked ? <CheckIcon width={10} height={10} className="text-white mix-blend-difference" /> : null}
              </span>
              <span className={cn(checked ? 'font-semibold' : 'opacity-70')}>
                {CHECKBOX_LABELS[key]}
              </span>
            </button>
            {key === 'cbEval' && checked ? (
              <div className="ml-6 flex flex-wrap gap-1">
                {EVAL_STATUS_OPTIONS.map((opt) => {
                  const active = opt.value === evalStatus;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => changeEval(opt.value)}
                      disabled={pending || active}
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-opacity hover:opacity-80 disabled:cursor-default"
                      style={{
                        backgroundColor: active ? opt.bg : 'rgba(0,0,0,0.05)',
                        color: active ? opt.fg : 'currentColor',
                        opacity: active ? 1 : 0.6,
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
