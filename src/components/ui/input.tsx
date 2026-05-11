'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'w-full rounded-xl border-[1.5px] border-black/20 bg-white px-[14px] py-2 text-black outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-black/40 focus:border-[var(--jaune)] focus:shadow-[0_0_0_3px_rgba(255,240,86,0.4)] disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
