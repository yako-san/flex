import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/*
 * Button V1 → V2 : forme pill (border-radius: var(--btn-radius) = 30px),
 * typographie h4 (uppercase, letter-spacing 0.1em, weight 900).
 * Hauteurs : sm 32, md 38, lg 44 (var(--btn-h-*)).
 * Variants alignés sur globals.css V1 (.btn-primary / .btn-secondary / .btn-danger)
 * + ajouts V2 (ghost, link) qui restent utiles pour les actions secondaires.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-[number:var(--h4-weight)] uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--jaune)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40',
  {
    variants: {
      variant: {
        // V1 .btn-primary — jaune signature
        primary:
          'bg-[var(--jaune)] text-black hover:bg-[var(--jaune-h)] border-0',
        // Alias rétro-compat : "jaune" === primary
        jaune:
          'bg-[var(--jaune)] text-black hover:bg-[var(--jaune-h)] border-0',
        // V1 .btn-secondary — outline noir 50%
        secondary:
          'bg-transparent text-black border-2 border-[var(--text-secondary-50)] hover:bg-black/5',
        outline:
          'bg-transparent text-black border-2 border-[var(--text-secondary-50)] hover:bg-black/5',
        // V1 .btn-danger — rouge plein
        danger:
          'bg-[var(--rouge)] text-white hover:bg-[var(--rouge-h)] border-0',
        // V2 dark (utilisé pour actions principales contextuelles, ex:
        // « Transférer en réception » sur header fournisseur PO).
        dark:
          'bg-[var(--dark)] text-white hover:bg-black border-0',
        // V2 ghost / link — pour actions secondaires sans poids visuel
        ghost:
          'bg-transparent text-[var(--dark)] hover:bg-[var(--gris-fond)] border-0 normal-case tracking-normal font-medium',
        link:
          'bg-transparent text-[#1565c0] hover:underline border-0 normal-case tracking-normal font-medium underline-offset-4',
      },
      size: {
        sm: 'h-[var(--btn-h-sm)] px-4 text-[length:var(--h4-size)] rounded-full',
        md: 'h-[var(--btn-h-md)] px-5 text-[length:var(--h4-size)] rounded-full',
        lg: 'h-[var(--btn-h-lg)] px-6 text-[length:var(--h4-size)] rounded-full',
        icon: 'h-[var(--btn-h-md)] w-[var(--btn-h-md)] p-0 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
