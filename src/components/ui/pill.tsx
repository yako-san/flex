import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Badge statut V1. Variants alignés sur les tokens `--st-*` et `--cmd-*`.
 * Aucun style en dur : tout passe par CSS variables → un Workshop.theme
 * peut surcharger sans rebuild.
 */
const pillVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap',
  {
    variants: {
      variant: {
        // Statuts vélo
        rv:        'bg-[var(--st-rv-bg)]        text-[var(--st-rv-fg)]',
        recu:      'bg-[var(--st-recu-bg)]      text-[var(--st-recu-fg)]',
        eval:      'bg-[var(--st-eval-bg)]      text-[var(--st-eval-fg)]',
        attente:   'bg-[var(--st-attente-bg)]   text-[var(--st-attente-fg)]',
        approuve:  'bg-[var(--st-approuve-bg)]  text-[var(--st-approuve-fg)]',
        'on-bench': 'bg-[var(--st-on-bench-bg)]  text-[var(--st-on-bench-fg)]',
        'ctrl-qlte': 'bg-[var(--st-ctrl-qlte-bg)] text-[var(--st-ctrl-qlte-fg)]',
        fini:      'bg-[var(--st-fini-bg)]      text-[var(--st-fini-fg)]',
        facturer:  'bg-[var(--st-facturer-bg)]  text-[var(--st-facturer-fg)]',
        facture:   'bg-[var(--st-facture-bg)]   text-[var(--st-facture-fg)]',
        livre:     'bg-[var(--st-livre-bg)]     text-[var(--st-livre-fg)]',
        // Cmd pièces
        'cmd-listee':    'bg-[var(--cmd-listee-bg)]    text-[var(--cmd-listee-fg)] border border-[var(--gris-bord)]',
        'cmd-estimee':   'bg-[var(--cmd-estimee-bg)]   text-[var(--cmd-estimee-fg)]',
        'cmd-a-cmder':   'bg-[var(--cmd-a-cmder-bg)]   text-[var(--cmd-a-cmder-fg)]',
        'cmd-en-cmde':   'bg-[var(--cmd-en-cmde-bg)]   text-[var(--cmd-en-cmde-fg)]',
        'cmd-recu-part': 'bg-[var(--cmd-recu-part-bg)] text-[var(--cmd-recu-part-fg)]',
        'cmd-recue':     'bg-[var(--cmd-recue-bg)]     text-[var(--cmd-recue-fg)]',
        // Étapes mécanos
        'etape-eval': 'bg-[var(--etape-eval-bg)] text-[var(--etape-eval-fg)]',
        'etape-meca': 'bg-[var(--etape-meca-bg)] text-[var(--etape-meca-fg)]',
        'etape-ctrl': 'bg-[var(--etape-ctrl-bg)] text-[var(--etape-ctrl-fg)]',
        // Génériques
        neutral: 'bg-[var(--gris-bord)] text-[var(--dark)]',
        staff:   'bg-[#eeeeee] text-[#666]',
      },
      size: {
        sm: 'text-[10px] px-2 py-0.5',
        md: 'text-xs px-2.5 py-0.5',
        lg: 'text-sm px-3 py-1',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'md',
    },
  },
);

export interface PillProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof pillVariants> {}

export function Pill({ className, variant, size, ...props }: PillProps) {
  return <span className={cn(pillVariants({ variant, size }), className)} {...props} />;
}

export { pillVariants };
