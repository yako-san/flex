import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/*
 * AddButton (40×40) et UtilButton (32×32) — boutons icône-only V1.
 *
 * V1 .btn-plus-round :
 *   - 40×40 cercle jaune signature
 *   - icône `+` colorée en rgba(0,0,0,0.5) (gris noir 50%, pas noir pur)
 *   - shadow `0 2px 6px rgba(0,0,0,0.18)` au repos
 *   - hover : jaune-h + shadow `0 3px 10px rgba(0,0,0,0.25)`
 *   - variante `--outline` : transparent + border 1.5px noir 50% + pas de shadow
 *
 * Le tag `tone="addOutline"` correspond au .btn-plus-round--outline V1.
 */
const iconButtonVariants = cva(
  'inline-flex items-center justify-center rounded-full shrink-0 transition-[background-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--jaune)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>svg]:text-[var(--text-secondary-50)] [&>svg]:[stroke-width:3]',
  {
    variants: {
      tone: {
        add:
          'bg-[var(--jaune)] text-[var(--text-secondary-50)] hover:bg-[var(--jaune-h)] shadow-[0_2px_6px_rgba(0,0,0,0.18)] hover:shadow-[0_3px_10px_rgba(0,0,0,0.25)]',
        addOutline:
          'bg-transparent text-[var(--text-secondary-50)] border-[1.5px] border-[var(--text-secondary-50)] hover:bg-black/5 shadow-none',
        util:
          'bg-white text-[var(--dark)] border border-[var(--gris-bord)] hover:bg-[var(--gris-fond)] [&>svg]:text-current [&>svg]:[stroke-width:2]',
        utilDark:
          'bg-[var(--overlay-dark-20)] text-white hover:bg-black/40 [&>svg]:text-current [&>svg]:[stroke-width:2]',
        danger:
          'bg-[var(--rouge)] text-white hover:bg-[var(--rouge-h)] [&>svg]:text-current [&>svg]:[stroke-width:2]',
      },
      size: {
        sm: 'h-[32px] w-[32px]',
        md: 'h-[var(--addbtn-size)] w-[var(--addbtn-size)]',
        lg: 'h-[44px] w-[44px]',
      },
    },
    defaultVariants: {
      tone: 'add',
      size: 'md',
    },
  },
);

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  'aria-label': string; // requis : un IconButton sans texte doit annoncer son rôle
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, tone, size, ...props }, ref) => (
    <button
      ref={ref}
      type={props.type ?? 'button'}
      className={cn(iconButtonVariants({ tone, size }), className)}
      {...props}
    />
  ),
);
IconButton.displayName = 'IconButton';

/** Sucre syntaxique : AddButton (37×37 jaune signature). */
export const AddButton = React.forwardRef<HTMLButtonElement, Omit<IconButtonProps, 'tone' | 'size'>>(
  (props, ref) => <IconButton ref={ref} tone="add" size="md" {...props} />,
);
AddButton.displayName = 'AddButton';

/** Sucre syntaxique : UtilButton (32×32 gris/blanc utilitaire). */
export const UtilButton = React.forwardRef<HTMLButtonElement, Omit<IconButtonProps, 'tone' | 'size'>>(
  (props, ref) => <IconButton ref={ref} tone="util" size="sm" {...props} />,
);
UtilButton.displayName = 'UtilButton';
