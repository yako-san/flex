'use client';

import { startTransition, useOptimistic, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/lib/utils/toast';
import { updatePieceItemCmdAction } from '../actions';

type CmdStatus =
  | 'LISTEE'
  | 'ESTIMEE'
  | 'A_COMMANDER'
  | 'EN_COMMANDE'
  | 'RECU_PARTIEL'
  | 'RECUE';

const CMD_STATUS_OPTIONS: { value: CmdStatus | ''; label: string; sigle: string; bg: string; fg: string }[] = [
  { value: '',             label: '— non défini',    sigle: '·',   bg: 'var(--gris-bord)',       fg: 'var(--text-secondary-70)' },
  { value: 'LISTEE',       label: 'Listée',          sigle: '...', bg: 'var(--cmd-listee-bg)',   fg: 'var(--cmd-listee-fg)' },
  { value: 'ESTIMEE',      label: 'Estimée',         sigle: '—',   bg: 'var(--cmd-estimee-bg)',  fg: 'var(--cmd-estimee-fg)' },
  { value: 'A_COMMANDER',  label: 'À commander',     sigle: '√',   bg: 'var(--cmd-a-cmder-bg)',  fg: 'var(--cmd-a-cmder-fg)' },
  { value: 'EN_COMMANDE',  label: 'En commande',     sigle: '$',   bg: 'var(--cmd-en-cmde-bg)',  fg: 'var(--cmd-en-cmde-fg)' },
  { value: 'RECU_PARTIEL', label: 'Réception part.', sigle: '#',   bg: 'var(--cmd-recu-part-bg)', fg: 'var(--cmd-recu-part-fg)' },
  { value: 'RECUE',        label: 'Reçue',           sigle: '@',   bg: 'var(--cmd-recue-bg)',    fg: 'var(--cmd-recue-fg)' },
];

type Props = {
  itemId: string;
  cmdStatus: CmdStatus | null;
  cmdNote: string | null;
};

export function PieceCmdEditor({ itemId, cmdStatus, cmdNote }: Props) {
  const router = useRouter();
  const [pending, startSaveTransition] = useTransition();
  const [open, setOpen] = useState(false);

  // État optimistic : statut affiché immédiatement, sans attendre le serveur.
  const [optimisticStatus, setOptimisticStatus] = useOptimistic<CmdStatus | ''>(cmdStatus ?? '');
  const [note, setNote] = useState(cmdNote ?? '');

  const current = CMD_STATUS_OPTIONS.find((o) => o.value === optimisticStatus) ?? CMD_STATUS_OPTIONS[0]!;

  const save = (newStatus: CmdStatus | '', newNote: string) => {
    const fd = new FormData();
    fd.set('cmdStatus', newStatus);
    fd.set('cmdNote', newNote);
    startSaveTransition(async () => {
      // Optimistic update inside transition
      startTransition(() => setOptimisticStatus(newStatus));
      const r = await updatePieceItemCmdAction(itemId, fd);
      if (r.error) {
        toast(r.error, 'error');
      } else {
        setOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={current.label}
          className="inline-flex h-5 min-w-[28px] items-center justify-center rounded-full px-2 font-mono text-[11px] font-bold transition-opacity hover:opacity-80"
          style={{ backgroundColor: current.bg, color: current.fg }}
        >
          {current.sigle}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <label className="label-system">Statut commande</label>
        <div className="mb-3 flex flex-wrap gap-1">
          {CMD_STATUS_OPTIONS.map((o) => {
            const active = o.value === optimisticStatus;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => save(o.value, note)}
                disabled={pending}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-opacity disabled:opacity-50"
                style={{
                  backgroundColor: active ? o.bg : 'var(--gris-fond)',
                  color: active ? o.fg : 'var(--text-secondary-70)',
                  border: active ? '2px solid currentColor' : '2px solid transparent',
                }}
                title={o.label}
              >
                <span className="font-mono">{o.sigle}</span>
                <span>{o.label}</span>
              </button>
            );
          })}
        </div>

        <label className="label-system">Note fournisseur</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => {
            if (note !== (cmdNote ?? '')) save(optimisticStatus, note);
          }}
          placeholder="ex. cmd #12345 chez Babac"
          rows={2}
          className="input-system font-sans"
          style={{ resize: 'vertical' }}
        />
        <p className="mt-1 text-[10px] text-[var(--text-secondary-60)]">
          Auto-enregistré à la sélection du statut ou à la perte de focus.
        </p>
      </PopoverContent>
    </Popover>
  );
}
