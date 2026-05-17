'use client';

import Link from 'next/link';
import type { Route } from 'next';

type Props = {
  href?: string | undefined;
  title: string;
  icon: React.ReactNode;
  disabled?: boolean | undefined;
  target?: string | undefined;
};

export function ActionIcon({ href, title, icon, disabled, target }: Props) {
  const cls =
    'inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors ' +
    (disabled
      ? 'bg-black/5 text-[var(--text-secondary-50)] cursor-not-allowed'
      : 'bg-black/10 text-[var(--dark)] hover:bg-black/20');

  if (disabled || !href) {
    return (
      <span
        className={cls}
        title={title}
        aria-disabled={disabled}
        onClick={(e) => e.preventDefault()}
      >
        {icon}
      </span>
    );
  }
  if (target) {
    return (
      <a
        className={cls}
        href={href}
        title={title}
        target={target}
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        {icon}
      </a>
    );
  }
  return (
    <Link
      className={cls}
      href={href as Route}
      title={title}
      onClick={(e) => e.stopPropagation()}
    >
      {icon}
    </Link>
  );
}
