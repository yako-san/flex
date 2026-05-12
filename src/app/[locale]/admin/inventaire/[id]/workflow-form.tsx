'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { updateBdtWorkflowAction, type BdtFormState } from '../actions';
import { toast } from '@/lib/utils/toast';
import { cn } from '@/lib/utils';
import type { Bdc } from '@prisma/client';

type Props = {
  bdc: Pick<
    Bdc,
    | 'id'
    | 'evalStatus'
    | 'archiveStatus'
    | 'cbEvalEnvoye'
    | 'cbEval'
    | 'cbBonSortie'
    | 'cbArchiver'
    | 'remiseSvcType'
    | 'remiseSvcValue'
    | 'remisePceType'
    | 'remisePceValue'
    | 'avanceMontant'
    | 'avanceMode'
    | 'avanceNote'
    | 'noteClientEval'
    | 'noteClientFacture'
    | 'notes'
  >;
};

type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function WorkflowForm({ bdc }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initRef = useRef(false);
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>('idle');

  const [state, formAction] = useActionState<BdtFormState | null, FormData>(
    updateBdtWorkflowAction,
    null,
  );

  // Détection de save terminé (success ou erreur)
  useEffect(() => {
    if (!state) return;
    if (state.error) {
      setAutosaveStatus('error');
      toast(state.error, 'error');
    } else {
      setAutosaveStatus('saved');
      router.refresh();
      const t = setTimeout(() => setAutosaveStatus('idle'), 1500);
      return () => clearTimeout(t);
    }
  }, [state, router]);

  // Trigger autosave debounced 500ms sur tout changement de champ
  const triggerAutosave = () => {
    if (!initRef.current) {
      initRef.current = true;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setAutosaveStatus('saving');
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
    <form ref={formRef} action={formAction} onChange={triggerAutosave}>
      <input type="hidden" name="bdcId" value={bdc.id} />

      <AutosaveBadge status={autosaveStatus} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Statut éval">
          <select name="evalStatus" defaultValue={bdc.evalStatus} className="input-system">
            <option value="INDECIS">Indécis</option>
            <option value="ATTENTE">En attente</option>
            <option value="APPROUVE">Approuvé</option>
            <option value="REDUX">Redux (partiel)</option>
            <option value="REFUSE">Refusé</option>
          </select>
        </Field>
        <Field label="Statut archive">
          <select name="archiveStatus" defaultValue={bdc.archiveStatus} className="input-system">
            <option value="ACTIF">Actif</option>
            <option value="ARCHIVE_FACTURE">Archivé (facturé)</option>
            <option value="ARCHIVE_A_FACTURER">Archivé (à facturer)</option>
            <option value="ARCHIVE_REFUSE">Archivé (refusé)</option>
            <option value="ARCHIVE_CTRL_QLTE">Archivé (CTRL qualité)</option>
            <option value="ARCHIVE_EVAL">Archivé (éval seule)</option>
            <option value="ARCHIVE_LEGACY">Archivé (legacy v1)</option>
          </select>
        </Field>
      </div>

      <div className="my-4 grid grid-cols-2 gap-x-4 gap-y-2">
        <Checkbox name="cbEvalEnvoye" label="Éval envoyée client" defaultChecked={bdc.cbEvalEnvoye} />
        <Checkbox name="cbEval" label="Éval validée mécano" defaultChecked={bdc.cbEval} />
        <Checkbox name="cbBonSortie" label="Bon de sortie imprimé" defaultChecked={bdc.cbBonSortie} />
        <Checkbox name="cbArchiver" label="Archivage déclenché" defaultChecked={bdc.cbArchiver} />
      </div>

      <h3 className="mt-4 mb-2 text-sm font-semibold text-[var(--dark)]">Remises</h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <RemiseField
          label="Services"
          typeName="remiseSvcType"
          valueName="remiseSvcValue"
          defaultType={bdc.remiseSvcType ?? ''}
          defaultValue={bdc.remiseSvcValue ? String(bdc.remiseSvcValue) : ''}
        />
        <RemiseField
          label="Pièces"
          typeName="remisePceType"
          valueName="remisePceValue"
          defaultType={bdc.remisePceType ?? ''}
          defaultValue={bdc.remisePceValue ? String(bdc.remisePceValue) : ''}
        />
      </div>

      <h3 className="mt-4 mb-1 text-sm font-semibold text-[var(--dark)]">Avance / acompte client</h3>
      <p className="mb-2 text-xs text-[var(--text-secondary-60)]">
        N&apos;affecte pas les taxes — affichage « reste à payer » sur le PDF facture.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_2fr]">
        <Field label="Montant ($)">
          <input
            name="avanceMontant"
            type="number"
            step="0.01"
            min="0"
            defaultValue={bdc.avanceMontant ? String(bdc.avanceMontant) : ''}
            placeholder="0.00"
            className="input-system"
          />
        </Field>
        <Field label="Mode">
          <select name="avanceMode" defaultValue={bdc.avanceMode ?? ''} className="input-system">
            <option value="">—</option>
            <option value="COMPTANT">Comptant</option>
            <option value="INTERAC">Interac</option>
            <option value="CARTES">Carte</option>
          </select>
        </Field>
        <Field label="Note">
          <input
            name="avanceNote"
            defaultValue={bdc.avanceNote ?? ''}
            placeholder="ex. acompte évaluation"
            className="input-system"
          />
        </Field>
      </div>

      <h3 className="mt-4 mb-2 text-sm font-semibold text-[var(--dark)]">
        Notes client (visibles dans PDFs et courriels)
      </h3>
      <Field label="Note évaluation">
        <textarea
          name="noteClientEval"
          defaultValue={bdc.noteClientEval ?? ''}
          rows={3}
          placeholder="Précisions à transmettre au client lors de l'évaluation"
          className="input-system font-sans"
          style={{ resize: 'vertical' }}
        />
      </Field>
      <div className="mt-2">
        <Field label="Note facture">
          <textarea
            name="noteClientFacture"
            defaultValue={bdc.noteClientFacture ?? ''}
            rows={3}
            placeholder="Précisions à transmettre au client lors de la facturation"
            className="input-system font-sans"
            style={{ resize: 'vertical' }}
          />
        </Field>
      </div>

      <div className="mt-3">
        <Field label="Notes (interne)">
          <textarea
            name="notes"
            defaultValue={bdc.notes ?? ''}
            rows={4}
            className="input-system font-sans"
            style={{ resize: 'vertical' }}
          />
        </Field>
      </div>
    </form>
  );
}

function AutosaveBadge({ status }: { status: AutosaveStatus }) {
  if (status === 'idle') return null;
  const config = {
    saving: { icon: <Loader2 size={12} className="animate-spin" />, text: 'Enregistrement…', color: 'text-[var(--text-secondary-60)]' },
    saved: { icon: <Check size={12} />, text: 'Enregistré', color: 'text-[var(--st-approuve-fg)]' },
    error: { icon: <AlertCircle size={12} />, text: 'Erreur', color: 'text-[var(--rouge)]' },
  } as const;
  const c = config[status];
  return (
    <div className={cn('mb-3 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider', c.color)}>
      {c.icon}
      <span>{c.text}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label-system">{label}</label>
      {children}
    </div>
  );
}

function Checkbox({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="custom-checkbox h-4 w-4" />
      <span>{label}</span>
    </label>
  );
}

function RemiseField({
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
