'use client';

import * as React from 'react';
import type { Client } from '@prisma/client';
import { FileEditIcon } from '@/components/icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ClientForm } from './client-form';

type Props = {
  client: Client;
};

/**
 * Bouton « Modifier client » V1 — ouvre une modale qui contient le
 * `<ClientForm initial={client}>`. Reproduit le pattern V1 (capture
 * `5b-client-edit-v1.png`) où toutes les modifications client se font
 * dans une fenêtre modale au-dessus de la liste, sans navigation
 * vers une 2e/3e page.
 *
 * La page standalone `/admin/clients/[id]/edit` reste fonctionnelle
 * pour le deep linking (partage d'URL, F5, etc.).
 */
export function ClientEditDialogTrigger({ client }: Props) {
  const [open, setOpen] = React.useState(false);
  const fullName = `${client.prenom} ${client.nom}`.trim();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`Modifier ${fullName}`}
        aria-label={`Modifier ${fullName}`}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/5 text-[var(--text-secondary-70)] transition-colors hover:bg-[var(--jaune)] hover:text-black"
      >
        <FileEditIcon className="h-3.5 w-3.5" aria-hidden />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Modifier client</DialogTitle>
            <DialogDescription className="text-xs text-[var(--text-secondary-60)]">
              {fullName} · {client.commPref} · {client.lang}
            </DialogDescription>
          </DialogHeader>
          {/* ClientForm gère sa propre Server Action updateClientAction.
              Sur succès, `revalidatePath` côté serveur rafraîchira la
              liste. La modale reste ouverte pour permettre des modifs
              consécutives — on ferme manuellement via clic dehors ou
              touche Échap. */}
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            <ClientForm initial={client} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
