'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { PlusIcon } from '@/components/icons';
import {
  AjoutItemsModal,
  type SelectableItem,
  type ItemKind,
} from '@/components/domain/ajout-items-modal';
import { addBdtItemsBulkAction } from '../actions';

type Props = {
  bdcId: string;
  services: SelectableItem[];
  pieces: SelectableItem[];
  /** Catégories haut niveau (filtre dropdown). */
  categories?: string[];
  /** Mode initial du modal — préset depuis le bloc d'ouverture. */
  initialKind?: ItemKind;
  /** Label du bouton d'ouverture (ex: « Ajouter un service »). */
  label?: string;
};

/**
 * Bouton « + Ajouter » qui ouvre `AjoutItemsModal` (modale V1 sélection
 * multiple). Sur confirm, appelle `addBdtItemsBulkAction` qui crée tous
 * les items en une transaction.
 *
 * Remplace l'ancien `<AddItemForm>` inline (un seul item à la fois,
 * pas de checkbox liste, pas de filtre catégorie).
 */
export function BdtAddItemsButton({
  bdcId,
  services,
  pieces,
  categories,
  initialKind = 'SERVICE',
  label = 'Ajouter',
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  async function handleConfirm({ kind, ids }: { kind: ItemKind; ids: string[] }) {
    startTransition(async () => {
      const r = await addBdtItemsBulkAction({ bdcId, kind, ids });
      if (r.ok) {
        toast.success(`${r.added} item${r.added > 1 ? 's' : ''} ajouté${r.added > 1 ? 's' : ''}`);
        setOpen(false);
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-full bg-black/10 px-3 py-1 text-[12px] font-semibold text-black/70 transition-colors hover:bg-black/20 disabled:opacity-50"
      >
        <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
        {label}
      </button>
      <AjoutItemsModal
        open={open}
        onOpenChange={setOpen}
        services={services}
        pieces={pieces}
        {...(categories ? { categories } : {})}
        initialKind={initialKind}
        onConfirm={handleConfirm}
      />
    </>
  );
}
