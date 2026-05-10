import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * AddButton (37×37) et UtilButton (32×32) — boutons icône-only V1.
 * `tone="add"` (jaune signature) ou `tone="util"` (gris/transparent).
 */
const iconButtonVariants = cva(
  'inline-flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--jaune)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      tone: {
        add:
          'bg-[var(--jaune)] text-black hover:bg-[var(--jaune-h)] shadow-sm',
        util:
          'bg-white text-[var(--dark)] border border-[var(--gris-bord)] hover:bg-[var(--gris-fond)]',
        utilDark:
          'bg-[var(--overlay-dark-20)] text-white hover:bg-black/40',
        danger:
          'bg-[var(--rouge)] text-white hover:bg-[var(--rouge-h)]',
      },
      size: {
        sm: 'h-[32px] w-[32px]',
        md: 'h-[37px] w-[37px]',
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
