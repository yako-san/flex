'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import {
  patchBdcAvanceAction,
  patchBdcNotesAction,
  patchBdcRemisesAction,
  type BdtFormState,
} from '../../bdcs/actions';
import { toast } from '@/lib/utils/toast';
import { cn } from '@/lib/utils';
import type { Bdc } from '@prisma/client';

// Sprint 4 polish — refonte du WorkflowForm en fragments séparés. Chaque
// fragment a sa propre Server Action ciblée + son propre autosave debounced.

type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/** Hook commun : trigger autosave (form.requestSubmit) au change debounced. */
function useFragmentAutosave(state: BdtFormState | null) {
  const router = useRouter();
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

  return { formRef, onChange, status };
}

function AutosaveBadge({ status, label }: { status: AutosaveStatus; label: string }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
        {label}
      </h3>
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
  );
}

// ───────────────────────────────────────────────────────────────────────────

type RemisesProps = {
  bdc: Pick<Bdc, 'id' | 'remiseSvcType' | 'remiseSvcValue' | 'remisePceType' | 'remisePceValue'>;
};

export function RemisesFragment({ bdc }: RemisesProps) {
  const [state, formAction] = useActionState<BdtFormState | null, FormData>(
    patchBdcRemisesAction,
    null,
  );
  const { formRef, onChange, status } = useFragmentAutosave(state);

  return (
    <section className="rounded-2xl bg-white/85 p-3 shadow-sm">
      <AutosaveBadge status={status} label="Remises" />
      <form ref={formRef} action={formAction} onChange={onChange}>
        <input type="hidden" name="bdcId" value={bdc.id} />
        <div className="grid gap-2 sm:grid-cols-2">
          <RemiseInput
            label="Services"
            typeName="remiseSvcType"
            valueName="remiseSvcValue"
            defaultType={bdc.remiseSvcType ?? ''}
            defaultValue={bdc.remiseSvcValue ? String(bdc.remiseSvcValue) : ''}
          />
          <RemiseInput
            label="Pièces"
            typeName="remisePceType"
            valueName="remisePceValue"
            defaultType={bdc.remisePceType ?? ''}
            defaultValue={bdc.remisePceValue ? String(bdc.remisePceValue) : ''}
          />
        </div>
      </form>
    </section>
  );
}

function RemiseInput({
  label,
  typeName,
  valueName,
  defaultType,
  defaultValue,
}: {
  label: string;
  typeName: string;
  valueName: string;
  defaultType: string;
  defaultValue: string;
}) {
  return (
    <div>
      <label className="label-system">{label}</label>
      <div className="flex gap-1">
        <select name={typeName} defaultValue={defaultType} className="input-system" style={{ width: 80 }}>
          <option value="">—</option>
          <option value="PCT">%</option>
          <option value="FIXED">$</option>
        </select>
        <input
          name={valueName}
          type="number"
          step="0.01"
          min="0"
          defaultValue={defaultValue}
          placeholder="0"
          className="input-system"
        />
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────

type AvanceProps = {
  bdc: Pick<Bdc, 'id' | 'avanceMontant' | 'avanceMode' | 'avanceNote'>;
};

export function AvanceFragment({ bdc }: AvanceProps) {
  const [state, formAction] = useActionState<BdtFormState | null, FormData>(
    patchBdcAvanceAction,
    null,
  );
  const { formRef, onChange, status } = useFragmentAutosave(state);

  return (
    <section className="rounded-2xl bg-white/85 p-3 shadow-sm">
      <AutosaveBadge status={status} label="Avance / acompte client" />
      <p className="mb-2 text-[11px] text-[var(--text-secondary-60)]">
        N&apos;affecte pas les taxes — affichage « reste à payer » sur le PDF facture.
      </p>
      <form ref={formRef} action={formAction} onChange={onChange}>
        <input type="hidden" name="bdcId" value={bdc.id} />
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_2fr]">
          <div>
            <label className="label-system">Montant ($)</label>
            <input
              name="avanceMontant"
              type="number"
              step="0.01"
              min="0"
              defaultValue={bdc.avanceMontant ? String(bdc.avanceMontant) : ''}
              placeholder="0.00"
              className="input-system"
            />
          </div>
          <div>
            <label className="label-system">Mode</label>
            <select name="avanceMode" defaultValue={bdc.avanceMode ?? ''} className="input-system">
              <option value="">—</option>
              <option value="COMPTANT">Comptant</option>
              <option value="INTERAC">Interac</option>
              <option value="CARTES">Cartes</option>
            </select>
          </div>
          <div>
            <label className="label-system">Note (optionnel)</label>
            <input
              name="avanceNote"
              defaultValue={bdc.avanceNote ?? ''}
              placeholder="ex. acompte évaluation"
              className="input-system"
            />
          </div>
        </div>
      </form>
    </section>
  );
}

// ───────────────────────────────────────────────────────────────────────────

type NotesProps = {
  bdc: Pick<Bdc, 'id' | 'noteClientEval' | 'noteClientFacture' | 'notes'>;
};

export function NotesFragment({ bdc }: NotesProps) {
  const [state, formAction] = useActionState<BdtFormState | null, FormData>(
    patchBdcNotesAction,
    null,
  );
  const { formRef, onChange, status } = useFragmentAutosave(state);

  return (
    <section className="rounded-2xl bg-white/85 p-3 shadow-sm">
      <AutosaveBadge status={status} label="Notes" />
      <form ref={formRef} action={formAction} onChange={onChange} className="space-y-2">
        <input type="hidden" name="bdcId" value={bdc.id} />
        <div>
          <label className="label-system">Note évaluation (visible PDF/courriel)</label>
          <textarea
            name="noteClientEval"
            defaultValue={bdc.noteClientEval ?? ''}
            rows={3}
            placeholder="Précisions à transmettre au client lors de l'évaluation"
            className="input-system font-sans"
            style={{ resize: 'vertical' }}
          />
        </div>
        <div>
          <label className="label-system">Note facture (visible PDF/courriel)</label>
          <textarea
            name="noteClientFacture"
            defaultValue={bdc.noteClientFacture ?? ''}
            rows={3}
            placeholder="Précisions à transmettre au client lors de la facturation"
            className="input-system font-sans"
            style={{ resize: 'vertical' }}
          />
        </div>
        <div>
          <label className="label-system">Notes internes (atelier)</label>
          <textarea
            name="notes"
            defaultValue={bdc.notes ?? ''}
            rows={4}
            className="input-system font-sans"
            style={{ resize: 'vertical' }}
          />
        </div>
      </form>
    </section>
  );
}
