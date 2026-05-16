'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { patchBdcNotesAction, type BdtFormState } from '../../bdcs/actions';
import { toast } from '@/lib/utils/toast';
import { cn } from '@/lib/utils';

type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

type Props = {
  bdcId: string;
  initialNotes: string;
  // Pour ne pas écraser les autres champs notes pendant l'autosave (l'action
  // `patchBdcNotesAction` update les 3 champs ; on conserve les autres tels
  // quels via hidden inputs).
  noteClientEval: string;
  noteClientFacture: string;
};

/**
 * Carte « NOTE INTERNE » V1 dans le sidecard du BDT — textarea éditable
 * avec autosave debounced 500ms. Reproduit le rendu V1 (textarea visible,
 * placeholder « aucune note ») et préserve les 2 autres notes en parallèle.
 */
export function NoteInterneFragment({
  bdcId,
  initialNotes,
  noteClientEval,
  noteClientFacture,
}: Props) {
  const router = useRouter();
  const [state, formAction] = useActionState<BdtFormState | null, FormData>(
    patchBdcNotesAction,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initRef = useRef(false);
  const [status, setStatus] = useState<AutosaveStatus>('idle');

  useEffect(() => {
    if (!state) return;
    if (state.error) {
      setStatus('error');
      toast(state.error, 'error');
    } else {
      setStatus('saved');
      router.refresh();
      const t = setTimeout(() => setStatus('idle'), 1500);
      return () => clearTimeout(t);
    }
  }, [state, router]);

  const onChange = () => {
    if (!initRef.current) {
      initRef.current = true;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setStatus('saving');
    debounceRef.current = setTimeout(() => {
      formRef.current?.requestSubmit();
    }, 500);
  };

  useEffect(() => {
    initRef.current = true;
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <form ref={formRef} action={formAction} onChange={onChange}>
      <input type="hidden" name="bdcId" value={bdcId} />
      <input type="hidden" name="noteClientEval" value={noteClientEval} />
      <input type="hidden" name="noteClientFacture" value={noteClientFacture} />
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
          Note interne
        </span>
        {status === 'idle' ? null : (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider',
              status === 'saving' && 'text-[var(--text-secondary-60)]',
              status === 'saved' && 'text-[var(--st-approuve-fg)]',
              status === 'error' && 'text-[var(--rouge)]',
            )}
          >
            {status === 'saving' ? <Loader2 size={11} className="animate-spin" /> : null}
            {status === 'saved' ? <Check size={11} /> : null}
            {status === 'error' ? <AlertCircle size={11} /> : null}
            {status === 'saving' ? 'Enreg.' : status === 'saved' ? 'OK' : 'Err'}
          </span>
        )}
      </div>
      <textarea
        name="notes"
        defaultValue={initialNotes}
        rows={6}
        placeholder="aucune note"
        className="input-system font-sans w-full"
        style={{ resize: 'vertical', fontSize: '12px' }}
      />
    </form>
  );
}
