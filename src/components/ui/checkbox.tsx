'use client';

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { cn } from '@/lib/utils';

/**
 * Checkbox V1 .custom-checkbox — 20×20, transparent, border 2px noir 50%,
 * radius 4. Coche dessinée en CSS via ::after rotate. Reproduit ici en
 * JSX via Radix Indicator + un span absolument positionné.
 *
 * Le checkmark est tracé via deux bordures (right + bottom) puis tourné
 * 45° — pas d'icône lucide pour matcher V1 au pixel près.
 */
export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'relative inline-block h-5 w-5 shrink-0 rounded-[4px] border-2 border-[var(--text-secondary-50)] bg-transparent transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--jaune)] focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'data-[state=checked]:border-[var(--text-secondary-70)]',
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="absolute inset-0">
      <span
        aria-hidden
        className="absolute left-[4px] top-0 h-3 w-[6px] rotate-45 border-b-2 border-r-2 border-[var(--text-secondary-70)]"
      />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;
