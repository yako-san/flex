import * as React from 'react';
import Link from 'next/link';
import type { VeloStatus } from '@prisma/client';
import { Pill } from '@/components/ui/pill';
import { VELO_STATUS_COLORS, VELO_STATUS_LABELS } from '@/lib/velo/status-labels';
import { cn } from '@/lib/utils';

type Mecano = { id: string; nom: string };
type Section = 'client' | 'velo';

const STATUS_TO_PILL: Record<VeloStatus, 'rv' | 'recu' | 'eval' | 'attente' | 'approuve' | 'on-bench' | 'ctrl-qlte' | 'fini' | 'facturer' | 'facture' | 'livre'> = {
  RV: 'rv',
  RECU: 'recu',
  EVAL: 'eval',
  EN_ATTENTE: 'attente',
  APPROUVE: 'approuve',
  ON_BENCH: 'on-bench',
  CTRL_QLTE: 'ctrl-qlte',
  FINI: 'fini',
  FACTURER: 'facturer',
  FACTURE: 'facture',
  LIVRE: 'livre',
};

export type BdtSidecardProps = {
  locale: string;
  bdcNumero: number;
  veloNumero: number;
  veloStatus: VeloStatus;
  velo: {
    marque?: string | null;
    modele?: string | null;
    couleur?: string | null;
    taille?: string | null;
    numeroSerie?: string | null;
  };
  client: { id: string; prenom: string; nom: string } | null;
  dateIn: Date | null;
  dateOut: Date | null;
  evalMecano: Mecano | null;
  mecaMecano: Mecano | null;
  ctrlMecano: Mecano | null;
  workflow: {
    cbEvalEnvoye: boolean;
    cbEval: boolean;
    cbBonSortie: boolean;
    cbArchiver: boolean;
  };
  /** Slot client pour remplacer les checkboxes statiques par des toggles interactifs (optimistic UI). */
  advancementSlot?: React.ReactNode;
  /** Section affichée : 'client' (par défaut) ou 'velo'. */
  section?: Section;
  /** URL pour switcher (server-side via searchParams). */
  sectionToggleUrl?: { client: string; velo: string };
  /** Note interne (textarea read-only par défaut). */
  noteInterne?: string | null;
  /** Slot interactif pour rendre la note interne en textarea autosave. Si
   *  fourni, écrase l'affichage read-only de `noteInterne`. */
  noteInterneSlot?: React.ReactNode;
  /** Slot bas : workflow form complet (remises, avance, etc.). */
  footerSlot?: React.ReactNode;
};

function formatDate(d: Date | null): string {
  if (!d) return '—';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}\n${hh}:${mm}`;
}

export function BdtSidecard({
  locale,
  bdcNumero,
  veloNumero,
  veloStatus,
  velo,
  client,
  dateIn,
  dateOut,
  evalMecano,
  mecaMecano,
  ctrlMecano,
  workflow,
  advancementSlot,
  section = 'client',
  sectionToggleUrl,
  noteInterne,
  noteInterneSlot,
  footerSlot,
}: BdtSidecardProps) {
  const bg = VELO_STATUS_COLORS[veloStatus].bg;
  const fg = VELO_STATUS_COLORS[veloStatus].fg;
  const statusLabel = VELO_STATUS_LABELS[veloStatus].fr;
  const pillVariant = STATUS_TO_PILL[veloStatus];

  return (
    <aside className="flex flex-col gap-4">
      {/* Carte principale colorée selon statut */}
      <div
        className="rounded-3xl p-4 shadow-sm"
        style={{ backgroundColor: bg, color: fg }}
      >
        <header className="mb-3 flex items-center justify-between gap-2">
          <span className="font-mono text-3xl font-bold tracking-wider">
            {String(bdcNumero).padStart(4, '0')}
          </span>
          <Pill variant={pillVariant} size="sm">{statusLabel}</Pill>
        </header>

        <Hr fg={fg} />

        <SectionLabel fg={fg}>Bon de travail</SectionLabel>
        <div className="mb-2 text-sm">
          {section === 'velo' || !client ? (
            <>
              <div className="font-semibold">
                {[velo.marque, velo.modele].filter(Boolean).join(', ') || 'Sélection → …'}
              </div>
              <div className="text-xs opacity-80">
                {[velo.couleur, velo.taille].filter(Boolean).join(', ') || '—'}
              </div>
              {velo.numeroSerie ? (
                <div className="mt-1 font-mono text-[11px] opacity-70">
                  S/N {velo.numeroSerie}
                </div>
              ) : null}
              <div className="mt-1 font-mono text-[11px] opacity-70">
                vélo {String(veloNumero).padStart(4, '0')}
              </div>
            </>
          ) : (
            <>
              <Link
                href={`/${locale}/admin/clients/${client.id}` as never}
                className="font-semibold underline-offset-2 hover:underline"
                style={{ color: fg }}
              >
                {`${client.prenom} ${client.nom}`.trim()}
              </Link>
              <div className="text-xs opacity-80">
                {[velo.marque, velo.modele, velo.couleur].filter(Boolean).join(', ') || '—'}
              </div>
              <div className="mt-1 font-mono text-[11px] opacity-70">
                vélo {String(veloNumero).padStart(4, '0')}
              </div>
            </>
          )}
        </div>

        <Hr fg={fg} />

        <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
          <DateField fg={fg} label="Date in" value={formatDate(dateIn)} />
          <DateField fg={fg} label="Date out" value={formatDate(dateOut)} />
        </div>

        <Hr fg={fg} />

        <SectionLabel fg={fg}>Séquence de travail</SectionLabel>
        <div className="mb-3 space-y-1 text-xs">
          <MecanoLine label="évaluation" mecano={evalMecano} />
          <MecanoLine label="mécanique" mecano={mecaMecano} />
          <MecanoLine label="ctrl. qlté" mecano={ctrlMecano} />
        </div>

        <Hr fg={fg} />

        <SectionLabel fg={fg}>Avancement</SectionLabel>
        <div className="mb-3">
          {advancementSlot ?? (
            <ul className="space-y-1.5 text-xs">
              <WorkflowItem checked={workflow.cbEvalEnvoye} label="Évaluation envoyée" />
              <WorkflowItem checked={workflow.cbEval}       label="Éval. validée" />
              <WorkflowItem checked={workflow.cbBonSortie}  label="Bon de sortie" />
              <WorkflowItem checked={workflow.cbArchiver}   label="Archiver" />
            </ul>
          )}
        </div>

        {sectionToggleUrl ? (
          <div className="mt-4 flex gap-1">
            <Link
              href={sectionToggleUrl.client as never}
              className={cn(
                'inline-flex flex-1 items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors',
                section === 'client'
                  ? 'bg-white/90 text-black'
                  : 'bg-black/10 text-current hover:bg-black/20',
              )}
            >
              Client
            </Link>
            <Link
              href={sectionToggleUrl.velo as never}
              className={cn(
                'inline-flex flex-1 items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors',
                section === 'velo'
                  ? 'bg-white/90 text-black'
                  : 'bg-black/10 text-current hover:bg-black/20',
              )}
            >
              Vélo
            </Link>
          </div>
        ) : null}
      </div>

      {/* Panneau note interne (toujours visible, en dehors de la carte colorée) */}
      <div className="rounded-2xl bg-white/85 p-3 shadow-sm">
        {noteInterneSlot ?? (
          <>
            <SectionLabel fg="rgba(0,0,0,0.6)">Note interne</SectionLabel>
            <div className="whitespace-pre-wrap text-xs text-[var(--text-secondary-70)]">
              {noteInterne?.trim() || (
                <span className="italic opacity-60">aucune note</span>
              )}
            </div>
          </>
        )}
      </div>

      {footerSlot}
    </aside>
  );
}

function Hr({ fg }: { fg: string }) {
  return <div className="mb-3 h-px" style={{ backgroundColor: fg, opacity: 0.15 }} />;
}

function SectionLabel({ children, fg }: { children: React.ReactNode; fg: string }) {
  return (
    <div
      className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em]"
      style={{ color: fg, opacity: 0.65 }}
    >
      {children}
    </div>
  );
}

function DateField({ fg, label, value }: { fg: string; label: string; value: string }) {
  return (
    <div>
      <SectionLabel fg={fg}>{label}</SectionLabel>
      <div className="whitespace-pre-line font-mono text-[11px]">{value}</div>
    </div>
  );
}

function MecanoLine({ label, mecano }: { label: string; mecano: Mecano | null }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[11px] opacity-70">{label}</span>
      <span className="font-mono text-xs">{mecano?.nom ?? '—'}</span>
    </div>
  );
}

function WorkflowItem({ checked, label }: { checked: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span
        aria-hidden
        className={cn(
          'inline-block h-4 w-4 shrink-0 rounded-[3px] border-2 border-current',
          checked && 'bg-current',
        )}
      />
      <span className={cn(checked ? 'font-semibold' : 'opacity-70')}>{label}</span>
    </li>
  );
}
