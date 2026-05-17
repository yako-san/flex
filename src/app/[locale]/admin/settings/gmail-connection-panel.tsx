'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { customConfirm } from '@/components/ui/confirm-dialog';
import { toast } from '@/lib/utils/toast';

type Props = {
  connected: boolean;
  email: string | null;
  successMessage: string | null;
  errorMessage: string | null;
};

export function GmailConnectionPanel({
  connected,
  email,
  successMessage,
  errorMessage,
}: Props) {
  const [pending, start] = useTransition();
  const router = useRouter();

  const disconnect = async () => {
    const ok = await customConfirm({
      title: `Déconnecter Gmail (${email}) ?`,
      message: 'Le refresh token sera révoqué. Tu devras te reconnecter pour utiliser le mode brouillon.',
      confirmLabel: 'Déconnecter',
      variant: 'danger',
    });
    if (!ok) return;
    start(async () => {
      const r = await fetch('/api/auth/google/disconnect', { method: 'POST' });
      if (r.ok) {
        toast('Gmail déconnecté', 'success');
        router.refresh();
      } else {
        toast(`Échec déconnexion : ${await r.text()}`, 'error');
      }
    });
  };

  return (
    <div className="mb-8 rounded-xl border border-[var(--gris-bord)] bg-white/60 p-4">
      {successMessage ? (
        <div className="mb-3 rounded-xl border border-green-300 bg-green-50 p-3 text-sm text-green-800">
          ✓ {successMessage}
        </div>
      ) : null}
      {errorMessage ? (
        <div className="mb-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          ✕ {errorMessage}
        </div>
      ) : null}

      {connected ? (
        <>
          <p className="mb-3">
            <span className="font-semibold text-green-700">✓ Gmail connecté</span>
            {' — '}
            <code>{email}</code>
          </p>
          <p className="mb-3 text-xs text-[var(--text-secondary-60)]">
            Le mode <strong>Brouillon</strong> sera proposé par défaut sur les
            courriels d&apos;évaluation, facture, suivi. Tu pourras toujours
            choisir <strong>Envoyer maintenant</strong> au cas par cas.
          </p>
          <div className="flex flex-wrap gap-2">
            <a href="/api/auth/google/start" className="btn-secondary">
              🔄 Reconnecter (changer de compte)
            </a>
            <button type="button" onClick={disconnect} disabled={pending} className="btn-danger">
              {pending ? 'Déconnexion…' : 'Déconnecter Gmail'}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mb-3 text-sm text-[var(--text-secondary-60)]">
            ⓘ Aucun compte Gmail connecté. Sans connexion, les courriels seront
            envoyés en direct (SMTP/Resend) sans étape de relecture.
          </p>
          <a href="/api/auth/google/start" className="btn-primary">
            🔗 Connecter un compte Gmail
          </a>
        </>
      )}
    </div>
  );
}
