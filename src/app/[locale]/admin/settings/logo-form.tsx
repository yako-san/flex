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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem',
            background: '#fafafa',
            border: '1px solid #e0e0e0',
            borderRadius: 6,
            marginBottom: '1rem',
          }}
        >
          <img
            src={currentLogoBase64}
            alt="Logo actuel"
            style={{ width: 80, height: 80, objectFit: 'contain', background: 'white', border: '1px solid #eee', borderRadius: 4 }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>Logo actuel</div>
            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: 2 }}>
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

      <form action={formAction}>
        <div style={{ marginBottom: '0.85rem' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: 500,
              color: '#444',
              marginBottom: '0.3rem',
            }}
          >
            {currentLogoBase64 ? 'Remplacer par' : 'Choisir un fichier'}
          </label>
          <input
            type="file"
            name="logo"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            required
            disabled={pending}
            style={{
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: 4,
              background: 'white',
              width: '100%',
            }}
          />
          <p style={{ fontSize: '0.78rem', color: '#888', marginTop: 4 }}>
            PNG, JPG, WebP ou SVG. Max 500 KB. Format carré recommandé pour
            le favicon.
          </p>
        </div>

        {state?.error ? (
          <div
            style={{
              background: '#ffebee',
              border: '1px solid #f44336',
              color: '#c62828',
              padding: '0.6rem 0.75rem',
              borderRadius: 4,
              marginBottom: '0.75rem',
              fontSize: '0.9rem',
            }}
          >
            {state.error}
          </div>
        ) : null}

        {state?.success ? (
          <div
            style={{
              background: '#e8f5e9',
              border: '1px solid #4caf50',
              color: '#2e7d32',
              padding: '0.6rem 0.75rem',
              borderRadius: 4,
              marginBottom: '0.75rem',
              fontSize: '0.9rem',
            }}
          >
            ✓ Logo enregistré.
          </div>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          style={{
            padding: '0.55rem 1.1rem',
            background: pending ? '#999' : '#1a1a1a',
            color: 'white',
            border: 0,
            borderRadius: 4,
            cursor: pending ? 'wait' : 'pointer',
            fontSize: '0.9rem',
          }}
        >
          {pending ? 'Upload…' : 'Téléverser'}
        </button>
      </form>
    </div>
  );
}
