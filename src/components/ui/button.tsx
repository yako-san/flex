'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--jaune)] focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--jaune)] text-black hover:bg-[var(--jaune-h)] border-0',
        secondary:
          'bg-transparent text-black/80 border-2 border-black/50 hover:bg-black/5',
        danger:
          'bg-[var(--rouge)] text-white hover:bg-[var(--rouge-h)] border-0',
        ghost:
          'bg-transparent text-black/80 hover:bg-black/5 border-0',
        link:
          'bg-transparent text-black/80 underline-offset-4 hover:underline border-0 normal-case tracking-normal font-normal',
      },
      size: {
        default: 'h-[38px] px-5 text-[0.9rem] rounded-[30px]',
        sm: 'h-8 px-3 text-xs rounded-[24px]',
        lg: 'h-12 px-7 text-base rounded-[30px]',
        icon: 'h-9 w-9 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
