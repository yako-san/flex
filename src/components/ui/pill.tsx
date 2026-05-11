import * as React from 'react';
import { cn } from '@/lib/utils';

export type VeloStatus =
  | 'RV'
  | 'REÇU'
  | 'ÉVAL.'
  | 'EN ATTENTE'
  | 'APPROUVÉ'
  | 'ON BENCH'
  | 'CTRL QLTÉ'
  | 'FINI'
  | 'FACTURER'
  | 'FACTURÉ'
  | 'LIVRÉ'
  | 'REFUSÉ';

export type CmdStatus = '...' | '—' | '√' | '$' | '#' | '@';

export type EtapeMeca = 'eval' | 'meca' | 'ctrl';

const veloStatusStyle: Record<VeloStatus, { bg: string; fg: string }> = {
  'RV':         { bg: 'var(--st-rv-bg)',         fg: 'var(--st-rv-fg)' },
  'REÇU':       { bg: 'var(--st-recu-bg)',       fg: 'var(--st-recu-fg)' },
  'ÉVAL.':      { bg: 'var(--st-eval-bg)',       fg: 'var(--st-eval-fg)' },
  'EN ATTENTE': { bg: 'var(--st-attente-bg)',    fg: 'var(--st-attente-fg)' },
  'APPROUVÉ':   { bg: 'var(--st-approuve-bg)',   fg: 'var(--st-approuve-fg)' },
  'ON BENCH':   { bg: 'var(--st-on-bench-bg)',   fg: 'var(--st-on-bench-fg)' },
  'CTRL QLTÉ':  { bg: 'var(--st-ctrl-qlte-bg)',  fg: 'var(--st-ctrl-qlte-fg)' },
  'FINI':       { bg: 'var(--st-fini-bg)',       fg: 'var(--st-fini-fg)' },
  'FACTURER':   { bg: 'var(--st-facturer-bg)',   fg: 'var(--st-facturer-fg)' },
  'FACTURÉ':    { bg: 'var(--st-facture-bg)',    fg: 'var(--st-facture-fg)' },
  'LIVRÉ':      { bg: 'var(--st-livre-bg)',      fg: 'var(--st-livre-fg)' },
  'REFUSÉ':     { bg: '#ffffff',                 fg: '#666666' },
};

const cmdStatusStyle: Record<CmdStatus, { bg: string; fg: string }> = {
  '...': { bg: 'var(--cmd-listee-bg)',    fg: 'var(--cmd-listee-fg)' },
  '—':   { bg: 'var(--cmd-estimee-bg)',   fg: 'var(--cmd-estimee-fg)' },
  '√':   { bg: 'var(--cmd-a-cmder-bg)',   fg: 'var(--cmd-a-cmder-fg)' },
  '$':   { bg: 'var(--cmd-en-cmde-bg)',   fg: 'var(--cmd-en-cmde-fg)' },
  '#':   { bg: 'var(--cmd-recu-part-bg)', fg: 'var(--cmd-recu-part-fg)' },
  '@':   { bg: 'var(--cmd-recue-bg)',     fg: 'var(--cmd-recue-fg)' },
};

const etapeStyle: Record<EtapeMeca, { bg: string; fg: string }> = {
  eval: { bg: 'var(--etape-eval-bg)', fg: 'var(--etape-eval-fg)' },
  meca: { bg: 'var(--etape-meca-bg)', fg: 'var(--etape-meca-fg)' },
  ctrl: { bg: 'var(--etape-ctrl-bg)', fg: 'var(--etape-ctrl-fg)' },
};

type PillProps = React.HTMLAttributes<HTMLSpanElement> & {
  size?: 'sm' | 'md' | 'lg';
} & (
    | { veloStatus: VeloStatus; cmdStatus?: never; etape?: never; bg?: never; fg?: never }
    | { cmdStatus: CmdStatus; veloStatus?: never; etape?: never; bg?: never; fg?: never }
    | { etape: EtapeMeca; veloStatus?: never; cmdStatus?: never; bg?: never; fg?: never }
    | { bg: string; fg: string; veloStatus?: never; cmdStatus?: never; etape?: never }
  );

export function Pill({
  className,
  size = 'md',
  children,
  veloStatus,
  cmdStatus,
  etape,
  bg,
  fg,
  ...props
}: PillProps) {
  const style = veloStatus
    ? veloStatusStyle[veloStatus]
    : cmdStatus
      ? cmdStatusStyle[cmdStatus]
      : etape
        ? etapeStyle[etape]
        : { bg: bg!, fg: fg! };

  const sizeClass = {
    sm: 'h-5 px-2 text-[10px]',
    md: 'h-6 px-2.5 text-[11px]',
    lg: 'h-8 px-3.5 text-xs',
  }[size];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-bold uppercase tracking-wider whitespace-nowrap',
        sizeClass,
        className,
      )}
      style={{ backgroundColor: style.bg, color: style.fg }}
      {...props}
    >
      {children ?? veloStatus ?? cmdStatus ?? etape}
    </span>
  );
}
