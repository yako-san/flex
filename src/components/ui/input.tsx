import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Input (V1 .input-system) — radius 12, border 1.5px noir 20%, focus
 * jaune signature + glow rgba(255,240,86,0.4).
 *
 * iOS Safari : 16px sur mobile pour empêcher le zoom auto sur tap.
 * Desktop (≥768px) : 14px (plus compact). Le globals.css gère le
 * fallback global pour tous les inputs/textareas/selects.
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'block w-full rounded-[var(--input-radius)] border-[1.5px] border-[var(--input-border)] bg-white px-[14px] py-2 text-black outline-none transition-[border-color,box-shadow] duration-150',
        'md:text-sm', // 14px desktop, 16px mobile (anti-zoom iOS, fallback global)
        'focus:border-[var(--jaune)] focus:shadow-[0_0_0_3px_var(--input-focus-ring)]',
        'disabled:cursor-not-allowed disabled:bg-black/[0.04]',
        'placeholder:text-[var(--text-secondary-50)]',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

/**
 * Textarea — même style que Input mais multi-ligne, hauteur min ajustable
 * via `rows` ou className.
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 3, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        'block w-full rounded-[var(--input-radius)] border-[1.5px] border-[var(--input-border)] bg-white px-[14px] py-2 text-black outline-none transition-[border-color,box-shadow] duration-150',
        'md:text-sm',
        'focus:border-[var(--jaune)] focus:shadow-[0_0_0_3px_var(--input-focus-ring)]',
        'disabled:cursor-not-allowed disabled:bg-black/[0.04]',
        'placeholder:text-[var(--text-secondary-50)]',
        'resize-y',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';
