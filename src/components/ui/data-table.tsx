import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Wrappers déclaratifs pour tables V1 — sticky header, hover, sections
 * groupables (`<RowGroup>`). Pas de logique de tri/pagination ici, juste
 * la structure visuelle. Pour les pages utilisant des sections (Inventaire),
 * imbriquer plusieurs `<tbody>` est valide HTML5.
 */

export function DataTable({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--gris-bord)] bg-white">
      <table className={cn('w-full text-sm', className)} {...props} />
    </div>
  );
}

export function DataTableHead({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        'sticky top-0 z-10 bg-[var(--gris-fond)] text-[length:var(--th-size)] font-[number:var(--th-weight)] lowercase tracking-wider text-[var(--text-secondary-60)]',
        className,
      )}
      {...props}
    />
  );
}

export function DataTableHeadCell({
  className,
  align = 'left',
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & { align?: 'left' | 'right' | 'center' }) {
  return (
    <th
      className={cn(
        'border-b border-[var(--gris-bord)] px-3 py-2 font-semibold',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        align === 'left' && 'text-left',
        className,
      )}
      {...props}
    />
  );
}

export function DataTableRow({
  className,
  selected,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { selected?: boolean }) {
  return (
    <tr
      className={cn(
        'border-b border-[var(--gris-bord)] transition-colors hover:bg-[var(--overlay-light-50)]',
        selected && 'bg-[var(--overlay-light-85)]',
        className,
      )}
      {...props}
    />
  );
}

export function DataTableCell({
  className,
  align = 'left',
  mono,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & {
  align?: 'left' | 'right' | 'center';
  mono?: boolean;
}) {
  return (
    <td
      className={cn(
        'px-3 py-2 align-middle',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        mono && 'font-mono',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Ligne séparation de section (NOUVEAU / WIP / FACTURÉ / STAFF) dans
 * une table groupée. Rendu volontairement minimal pour ne pas casser
 * le grid de la table — le label flotte au-dessus en small-caps grises.
 */
export function RowGroup({
  label,
  count,
  colSpan,
  className,
}: {
  label: string;
  count?: number;
  colSpan: number;
  className?: string;
}) {
  return (
    <tr className={cn('bg-transparent', className)}>
      <td
        colSpan={colSpan}
        className="border-b border-[var(--gris-bord)] bg-[var(--gris-fond)] px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary-60)]"
      >
        {label}
        {count != null ? <span className="ml-2 font-normal opacity-70">({count})</span> : null}
      </td>
    </tr>
  );
}
