import * as React from 'react';
import Link from 'next/link';
import { Pill } from '@/components/ui/pill';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Mecano = { id: string; nom: string };
type EvalStatus =
  | 'INDECIS'
  | 'APPROUVE'
  | 'REDUX'
  | 'ATTENTE'
  | 'REFUSE';
type ArchiveStatus =
  | 'ACTIF'
  | 'ARCHIVE_FACTURE'
  | 'ARCHIVE_A_FACTURER'
  | 'ARCHIVE_REFUSE'
  | 'ARCHIVE_CTRL_QLTE'
  | 'ARCHIVE_EVAL'
  | 'ARCHIVE_LEGACY';

const evalPillVariant = (s: EvalStatus): React.ComponentProps<typeof Pill>['variant'] => {
  switch (s) {
    case 'APPROUVE': return 'approuve';
    case 'REDUX': return 'eval';
    case 'ATTENTE': return 'attente';
    case 'REFUSE': return 'fini';
    default: return 'neutral';
  }
};

const archivePillVariant = (s: ArchiveStatus): React.ComponentProps<typeof Pill>['variant'] => {
  switch (s) {
    case 'ARCHIVE_FACTURE': return 'facture';
    case 'ARCHIVE_A_FACTURER': return 'facturer';
    case 'ARCHIVE_REFUSE': return 'fini';
    case 'ARCHIVE_CTRL_QLTE': return 'ctrl-qlte';
    case 'ARCHIVE_EVAL': return 'eval';
    case 'ACTIF': return 'on-bench';
    default: return 'neutral';
  }
};

export type BDCHeaderProps = {
  locale: string;
  bdcNumero: number;
  veloNumero: number;
  client: { id: string; prenom: string; nom: string } | null;
  velo: { marque?: string | null; modele?: string | null; couleur?: string | null } | null;
  evalStatus: EvalStatus;
  archiveStatus: ArchiveStatus;
  /** Liste des mécanos disponibles pour les 3 dropdowns. */
  mecanos: Mecano[];
  /** Mécanos assignés (peut être null = pas assigné). */
  evalMecanoId: string | null;
  mecaMecanoId: string | null;
  ctrlMecanoId: string | null;
  /** Workflow checkboxes V1. */
  cbEvalEnvoye: boolean;
  cbEval: boolean;
  cbBonSortie: boolean;
  cbArchiver: boolean;
  /** Actions header (boutons à droite). */
  actions?: React.ReactNode;
  /**
   * Slots pour brancher les contrôles interactifs en Phase 3 (server actions
   * via formulaires ou client callbacks). Si absent, dropdowns/checkboxes sont
   * rendus en lecture seule (display).
   */
  mecanoSelect?: (
    role: 'eval' | 'meca' | 'ctrl',
    selectedId: string | null,
  ) => React.ReactNode;
  workflowCheckbox?: (
    key: 'cbEvalEnvoye' | 'cbEval' | 'cbBonSortie' | 'cbArchiver',
    checked: boolean,
  ) => React.ReactNode;
};

/**
 * Carte sticky V1 en tête de fiche BDT (`/admin/inventaire/[id]`).
 *
 * Structure (selon v1-ui-bundle.md section 8.2) :
 *   - ligne 1 : N° BDT (gros, monospace) + N° vélo (gris secondaire)
 *               + client (lien) + marque/modèle/couleur + Pill éval + Pill archive
 *   - ligne 2 : 3 dropdowns mécanos (Éval / Méca / Ctrl) + 4 checkboxes workflow
 *   - actions à droite (boutons primaires + utilitaires)
 *
 * Composant pur côté UI : la logique d'attribution mécano (transitions
 * `nextStatusOnAssign`) et de validation workflow vit dans les server actions
 * de Phase 3, exposées ici via les slots `mecanoSelect` et `workflowCheckbox`.
 */
export function BDCHeader({
  locale,
  bdcNumero,
  veloNumero,
  client,
  velo,
  evalStatus,
  archiveStatus,
  mecanos,
  evalMecanoId,
  mecaMecanoId,
  ctrlMecanoId,
  cbEvalEnvoye,
  cbEval,
  cbBonSortie,
  cbArchiver,
  actions,
  mecanoSelect,
  workflowCheckbox,
}: BDCHeaderProps) {
  const veloLine = [velo?.marque, velo?.modele, velo?.couleur].filter(Boolean).join(', ');

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex flex-col gap-3 rounded-xl border border-[var(--gris-bord)] bg-white/95 p-4 shadow-sm backdrop-blur',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="font-mono text-3xl font-bold tracking-wider">
            {String(bdcNumero).padStart(4, '0')}
          </span>
          <span className="font-mono text-base text-[var(--text-secondary-50)]">
            vélo {String(veloNumero).padStart(4, '0')}
          </span>
          {client ? (
            <Link
              href={`/${locale}/admin/clients/${client.id}` as never}
              className="text-base font-semibold text-[#1565c0] hover:underline"
            >
              {`${client.prenom} ${client.nom}`.trim()}
            </Link>
          ) : (
            <span className="text-base text-[var(--text-secondary-50)]">walk-in</span>
          )}
          {veloLine ? (
            <span className="text-sm text-[var(--text-secondary-70)]">{veloLine}</span>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Pill variant={evalPillVariant(evalStatus)}>{evalStatus.toLowerCase()}</Pill>
        <Pill variant={archivePillVariant(archiveStatus)}>
          {archiveStatus.replace('ARCHIVE_', '').toLowerCase().replace('_', ' ')}
        </Pill>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[var(--gris-bord)] pt-3">
        <MecanoRow
          label="Éval"
          mecanos={mecanos}
          selectedId={evalMecanoId}
          slot={mecanoSelect ? mecanoSelect('eval', evalMecanoId) : null}
        />
        <MecanoRow
          label="Méca"
          mecanos={mecanos}
          selectedId={mecaMecanoId}
          slot={mecanoSelect ? mecanoSelect('meca', mecaMecanoId) : null}
        />
        <MecanoRow
          label="Ctrl"
          mecanos={mecanos}
          selectedId={ctrlMecanoId}
          slot={mecanoSelect ? mecanoSelect('ctrl', ctrlMecanoId) : null}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--gris-bord)] pt-3 text-sm">
        <WorkflowCheck
          label="Évaluation envoyée"
          checked={cbEvalEnvoye}
          slot={workflowCheckbox ? workflowCheckbox('cbEvalEnvoye', cbEvalEnvoye) : null}
        />
        <WorkflowCheck
          label="OK"
          checked={cbEval}
          slot={workflowCheckbox ? workflowCheckbox('cbEval', cbEval) : null}
        />
        <WorkflowCheck
          label="Bon de sortie"
          checked={cbBonSortie}
          slot={workflowCheckbox ? workflowCheckbox('cbBonSortie', cbBonSortie) : null}
        />
        <WorkflowCheck
          label="Archiver"
          checked={cbArchiver}
          slot={workflowCheckbox ? workflowCheckbox('cbArchiver', cbArchiver) : null}
        />
      </div>
    </header>
  );
}

function MecanoRow({
  label,
  mecanos,
  selectedId,
  slot,
}: {
  label: string;
  mecanos: Mecano[];
  selectedId: string | null;
  slot: React.ReactNode;
}) {
  const selected = mecanos.find((m) => m.id === selectedId);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-50)]">
        {label}
      </span>
      {slot ? (
        slot
      ) : (
        <span className="text-sm text-[var(--text-secondary-70)]">
          {selected?.nom ?? '—'}
        </span>
      )}
    </div>
  );
}

function WorkflowCheck({
  label,
  checked,
  slot,
}: {
  label: string;
  checked: boolean;
  slot: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-2 cursor-default">
      {slot ? (
        slot
      ) : (
        <span
          aria-hidden
          className={cn(
            'inline-block h-5 w-5 shrink-0 rounded-[4px] border-2 border-[var(--text-secondary-50)]',
            checked && 'bg-[var(--text-secondary-50)]',
          )}
        />
      )}
      <span className={cn('text-sm', checked ? 'text-[var(--dark)]' : 'text-[var(--text-secondary-70)]')}>
        {label}
      </span>
    </label>
  );
}

/** Helper d'usage dans le ui-kit / phase 3 — boutons d'action header standards. */
export function BDCHeaderActions({
  onSendEval,
  onEmitFacture,
  onArchive,
}: {
  onSendEval?: () => void;
  onEmitFacture?: () => void;
  onArchive?: () => void;
}) {
  return (
    <>
      {onSendEval ? (
        <Button variant="secondary" size="sm" onClick={onSendEval}>
          Envoyer éval
        </Button>
      ) : null}
      {onEmitFacture ? (
        <Button variant="dark" size="sm" onClick={onEmitFacture}>
          Émettre facture
        </Button>
      ) : null}
      {onArchive ? (
        <Button variant="primary" size="sm" onClick={onArchive}>
          Archiver
        </Button>
      ) : null}
    </>
  );
}
