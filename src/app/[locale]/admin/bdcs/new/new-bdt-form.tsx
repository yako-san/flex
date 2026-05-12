'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createBdtAction, type BdtFormState } from '../actions';
import { Button } from '@/components/ui/button';

type Props = {
  velos: { id: string; label: string }[];
  defaultVeloId: string | null;
};

export function NewBdtForm({ velos, defaultVeloId }: Props) {
  const [state, formAction] = useActionState<BdtFormState | null, FormData>(
    createBdtAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Vélo *" hint="Le BDT sera rattaché à ce vélo. Pour créer un nouveau vélo, passer par Vélos → Nouveau.">
        <select
          name="veloId"
          defaultValue={defaultVeloId ?? ''}
          required
          className="input-system"
        >
          <option value="">— sélectionner un vélo —</option>
          {velos.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Statut éval initial">
          <select name="evalStatus" defaultValue="INDECIS" className="input-system">
            <option value="INDECIS">Indécis (par défaut)</option>
            <option value="ATTENTE">En attente</option>
            <option value="APPROUVE">Approuvé</option>
            <option value="REDUX">Redux (partiel)</option>
            <option value="REFUSE">Refusé</option>
          </select>
        </Field>
        <Field label="Statut archive">
          <select name="archiveStatus" defaultValue="ACTIF" className="input-system">
            <option value="ACTIF">Actif</option>
            <option value="ARCHIVE_FACTURE">Archivé (facturé)</option>
            <option value="ARCHIVE_A_FACTURER">Archivé (à facturer)</option>
            <option value="ARCHIVE_REFUSE">Archivé (refusé)</option>
            <option value="ARCHIVE_CTRL_QLTE">Archivé (CTRL qualité)</option>
            <option value="ARCHIVE_EVAL">Archivé (éval seule)</option>
          </select>
        </Field>
      </div>

      <Field label="Notes initiales">
        <textarea
          name="notes"
          rows={4}
          className="input-system font-sans"
          style={{ resize: 'vertical' }}
        />
      </Field>

      {state?.error ? (
        <div className="rounded-xl border border-[var(--rouge)]/30 bg-[var(--rouge)]/10 p-3 text-sm text-[var(--rouge-h)]">
          {state.error}
        </div>
      ) : null}

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? 'Création…' : 'Créer le bon de travail'}
    </Button>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label-system">{label}</label>
      {children}
      {hint ? (
        <p className="mt-1 text-[11px] text-[var(--text-secondary-60)]">{hint}</p>
      ) : null}
    </div>
  );
}
