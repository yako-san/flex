'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArchiveIcon } from '@/components/icons';
import { ArchiveChoiceDialog, type ArchiveChoice } from '@/components/domain/archive-choice-dialog';
import { toast } from '@/lib/utils/toast';
import { archiveBdtWithChoiceAction } from '../../bdcs/actions';

type Props = {
  bdcId: string;
  resteAPayer: number;
};

export function ArchiveBdtButton({ bdcId, resteAPayer }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  const onChoose = async (choice: ArchiveChoice) => {
    await new Promise<void>((resolve) => {
      start(async () => {
        const r = await archiveBdtWithChoiceAction(bdcId, choice);
        if (r.error) {
          toast(r.error, 'error');
        } else {
          const label = choice === 'REFUSE' ? 'BDT archivé (refusé)' : `BDT archivé · payé ${choice.toLowerCase()}`;
          toast(label, 'success');
          setOpen(false);
          router.refresh();
        }
        resolve();
      });
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        className="inline-flex h-8 items-center gap-1 rounded-full bg-[var(--jaune)] px-3 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-[var(--jaune-h)] disabled:opacity-50"
      >
        <ArchiveIcon width={14} height={14} />
        {pending ? '…' : 'Archiver'}
      </button>
      <ArchiveChoiceDialog open={open} onOpenChange={setOpen} onChoose={onChoose} resteAPayer={resteAPayer} />
    </>
  );
}
