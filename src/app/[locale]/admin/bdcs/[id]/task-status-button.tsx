'use client';

import { useTransition } from 'react';
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
  TODO: { bg: '#fff9c4', fg: '#f57f17' },
  DONE: { bg: '#e8f5e9', fg: '#2e7d32' },
  SKIPPED: { bg: '#eeeeee', fg: '#666' },
};

export function TaskStatusButton({
  taskId,
  status: initial,
}: {
  taskId: string;
  status: Status;
}) {
  const [pending, startTransition] = useTransition();
  const c = COLOR[initial];
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const next = NEXT[initial];
        startTransition(async () => {
          const r = await updateTaskStatusAction(taskId, next);
          if (r?.error) alert(r.error);
        });
      }}
      title={`Statut : ${initial} (clique pour cycler)`}
      style={{
        background: c.bg,
        color: c.fg,
        border: 0,
        padding: '0.05rem 0.4rem',
        borderRadius: 3,
        fontSize: '0.7rem',
        fontWeight: 600,
        minWidth: 24,
        cursor: pending ? 'wait' : 'pointer',
      }}
    >
      {LABEL[initial]}
    </button>
  );
}
