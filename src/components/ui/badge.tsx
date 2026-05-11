import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border-0 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider',
  {
    variants: {
      variant: {
        default: 'bg-[var(--jaune)] text-black',
        secondary: 'bg-white/60 text-black/70',
        outline: 'border-2 border-black/30 text-black/70 bg-transparent',
        destructive: 'bg-[var(--rouge)] text-white',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
