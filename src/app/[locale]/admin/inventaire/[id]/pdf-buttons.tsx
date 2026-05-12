'use client';

import { useState, useTransition } from 'react';
import { FileText, Receipt } from 'lucide-react';
import { customConfirm } from '@/components/ui/confirm-dialog';
import { toast } from '@/lib/utils/toast';
import { emitFactureAction } from './emit-facture-action';

type Props = {
  bdcId: string;
  existingFactureLogId: string | null;
  existingFactureNumero: string | null;
};

export function PdfButtons({
  bdcId,
  existingFactureLogId,
  existingFactureNumero,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [emitted, setEmitted] = useState<{ id: string; numero: string } | null>(
    existingFactureLogId && existingFactureNumero
      ? { id: existingFactureLogId, numero: existingFactureNumero }
      : null,
  );

  return (
    <div className="flex flex-col gap-2">
      <a
        href={`/api/admin/bdcs/${bdcId}/eval.pdf`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[var(--gris-bord)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary-70)] no-underline transition-colors hover:border-[var(--jaune)] hover:bg-[var(--jaune)]/10"
      >
        <FileText size={14} />
        Évaluation (PDF)
      </a>

      {emitted ? (
        <a
          href={`/api/admin/factures/${emitted.id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--st-approuve-bg)] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--st-approuve-fg)] no-underline transition-opacity hover:opacity-90"
        >
          <Receipt size={14} />
          Facture {emitted.numero}
        </a>
      ) : (
        <FactureEmitForm
          pending={pending}
          onEmit={(mode) => {
            startTransition(async () => {
              const r = await emitFactureAction(bdcId, mode);
              if (r.error) {
                toast(r.error, 'error');
                return;
              }
              if (r.factureLogId && r.factureNumero) {
                setEmitted({ id: r.factureLogId, numero: r.factureNumero });
                toast(`Facture ${r.factureNumero} émise`, 'success');
              }
            });
          }}
        />
      )}
    </div>
  );
}

function FactureEmitForm({
  pending,
  onEmit,
}: {
  pending: boolean;
  onEmit: (mode: 'COMPTANT' | 'INTERAC' | 'CARTE' | 'AUTRE' | null) => void;
}) {
  const [mode, setMode] = useState<'COMPTANT' | 'INTERAC' | 'CARTE' | 'AUTRE' | ''>('');

  const handleClick = async () => {
    const ok = await customConfirm({
      title: 'Émettre la facture ?',
      message: 'Action immutable (numéro séquentiel attribué). Le BDT passe en archiveStatus FACTURE.',
      confirmLabel: 'Émettre',
    });
    if (!ok) return;
    onEmit(mode === '' ? null : mode);
  };

  return (
    <div className="rounded-2xl border border-[var(--gris-bord)] bg-[var(--gris-fond)] p-3">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
        Émettre la facture
      </div>
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as 'COMPTANT' | 'INTERAC' | 'CARTE' | 'AUTRE' | '')}
        className="input-system mb-2"
      >
        <option value="">— Mode de paiement —</option>
        <option value="COMPTANT">Comptant</option>
        <option value="INTERAC">Interac</option>
        <option value="CARTE">Carte</option>
        <option value="AUTRE">Autre</option>
      </select>
      <button
        type="button"
        disabled={pending}
        onClick={handleClick}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--st-approuve-bg)] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--st-approuve-fg)] transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        <Receipt size={14} />
        {pending ? 'Émission…' : 'Émettre la facture'}
      </button>
    </div>
  );
}
