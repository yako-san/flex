'use client';

import { useActionState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { customConfirm } from '@/components/ui/confirm-dialog';
import { toast } from '@/lib/utils/toast';
import { uploadLogoAction, removeLogoAction, type LogoState } from './logo-actions';

type Props = {
  currentLogoBase64: string | null;
};

export function LogoForm({ currentLogoBase64 }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<LogoState | null, FormData>(
    uploadLogoAction,
    null,
  );
  const [removing, startRemove] = useTransition();

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state, router]);

  return (
    <div>
      {currentLogoBase64 ? (
        <div className="mb-4 flex items-center gap-4 rounded-xl border border-[var(--gris-bord)] bg-white/60 p-4">
          <img
            src={currentLogoBase64}
            alt="Logo actuel"
            className="rounded-lg border border-[var(--gris-bord)] bg-white"
            style={{ width: 80, height: 80, objectFit: 'contain' }}
          />
          <div className="flex-1">
            <div className="text-sm font-medium">Logo actuel</div>
            <div className="mt-0.5 text-xs text-[var(--text-secondary-60)]">
              Utilisé sur les PDFs et le favicon (onglet du navigateur).
            </div>
          </div>
          <button
            type="button"
            disabled={removing}
            onClick={async () => {
              const ok = await customConfirm({
                title: 'Supprimer le logo actuel ?',
                confirmLabel: 'Supprimer',
                variant: 'danger',
              });
              if (!ok) return;
              startRemove(async () => {
                const r = await removeLogoAction();
                if (r.error) {
                  toast(r.error, 'error');
                } else {
                  toast('Logo supprimé', 'success');
                  router.refresh();
                }
              });
            }}
            className="inline-flex h-8 items-center gap-1 rounded-full border-2 border-[var(--rouge)] px-3 text-xs font-semibold uppercase tracking-wider text-[var(--rouge)] transition-colors hover:bg-[var(--rouge)]/10 disabled:opacity-50"
          >
            {removing ? 'Suppression…' : 'Supprimer'}
          </button>
        </div>
      ) : null}

      <form action={formAction} className="flex flex-col gap-3">
        <div className="mb-3">
          <label className="label-system">
            {currentLogoBase64 ? 'Remplacer par' : 'Choisir un fichier'}
          </label>
          <input
            type="file"
            name="logo"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            required
            disabled={pending}
            className="input-system mt-1"
          />
          <p className="mt-1 text-xs text-[var(--text-secondary-60)]">
            PNG, JPG, WebP ou SVG. Max 500 KB. Format carré recommandé pour
            le favicon.
          </p>
        </div>

        {state?.error ? (
          <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {state.error}
          </div>
        ) : null}

        {state?.success ? (
          <div className="rounded-xl border border-green-300 bg-green-50 p-3 text-sm text-green-800">
            ✓ Logo enregistré.
          </div>
        ) : null}

        <button type="submit" disabled={pending} className="btn-primary self-start">
          {pending ? 'Upload…' : 'Téléverser'}
        </button>
      </form>
    </div>
  );
}
