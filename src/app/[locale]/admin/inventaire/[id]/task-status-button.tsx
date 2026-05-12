'use client';

import { startTransition, useOptimistic, useTransition } from 'react';
import { toast } from '@/lib/utils/toast';
import { updateTaskStatusAction } from '../actions';

type Status = 'TODO' | 'DONE' | 'SKIPPED';

const NEXT: Record<Status, Status> = {
  TODO: 'DONE',
  DONE: 'SKIPPED',
  SKIPPED: 'TODO',
};
const LABEL: Record<Status, string> = {
  TODO: '○',
  DONE: '✓',
  SKIPPED: '−',
};
const COLOR: Record<Status, { bg: string; fg: string }> = {
  TODO:    { bg: 'var(--st-rv-bg)',         fg: 'var(--st-rv-fg)' },
  DONE:    { bg: 'var(--st-approuve-bg)',   fg: 'var(--st-approuve-fg)' },
  SKIPPED: { bg: 'var(--st-livre-bg)',      fg: 'var(--st-livre-fg)' },
};

export function TaskStatusButton({
  taskId,
  status: initial,
}: {
  taskId: string;
  status: Status;
}) {
  const [pending, startSave] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic<Status>(initial);
  const c = COLOR[optimisticStatus];

  const handleClick = () => {
    const next = NEXT[optimisticStatus];
    startSave(async () => {
      startTransition(() => setOptimisticStatus(next));
      const r = await updateTaskStatusAction(taskId, next);
      if (r?.error) toast(r.error, 'error');
    });
  };

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      title={`Statut : ${optimisticStatus} (clique pour cycler)`}
      className="inline-flex min-w-[24px] items-center justify-center rounded px-1.5 py-0.5 text-[11px] font-bold transition-opacity hover:opacity-80 disabled:cursor-wait"
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      {LABEL[optimisticStatus]}
    </button>
  );
}
