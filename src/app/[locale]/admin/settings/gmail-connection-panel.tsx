'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

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

  function disconnect() {
    if (!confirm(`Déconnecter Gmail (${email}) ? Le refresh token sera révoqué.`)) return;
    start(async () => {
      const r = await fetch('/api/auth/google/disconnect', { method: 'POST' });
      if (r.ok) router.refresh();
      else alert(`Échec déconnexion: ${await r.text()}`);
    });
  }

  return (
    <div
      style={{
        background: '#fafafa',
        border: '1px solid #e0e0e0',
        borderRadius: 6,
        padding: '1rem 1.25rem',
        marginBottom: '2rem',
      }}
    >
      {successMessage ? (
        <div
          style={{
            background: '#e8f5e9',
            border: '1px solid #2e7d32',
            color: '#1b5e20',
            padding: '0.6rem',
            borderRadius: 4,
            marginBottom: '0.75rem',
            fontSize: '0.9rem',
          }}
        >
          ✓ {successMessage}
        </div>
      ) : null}
      {errorMessage ? (
        <div
          style={{
            background: '#ffebee',
            border: '1px solid #f44336',
            color: '#c62828',
            padding: '0.6rem',
            borderRadius: 4,
            marginBottom: '0.75rem',
            fontSize: '0.9rem',
          }}
        >
          ✕ {errorMessage}
        </div>
      ) : null}

      {connected ? (
        <>
          <p style={{ margin: 0, marginBottom: '0.75rem' }}>
            <span style={{ color: '#2e7d32', fontWeight: 600 }}>✓ Gmail connecté</span>
            {' — '}
            <code>{email}</code>
          </p>
          <p style={{ color: '#666', fontSize: '0.8rem', marginTop: 0, marginBottom: '0.75rem' }}>
            Le mode <strong>Brouillon</strong> sera proposé par défaut sur les
            courriels d&apos;évaluation, facture, suivi. Tu pourras toujours
            choisir <strong>Envoyer maintenant</strong> au cas par cas.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <a href="/api/auth/google/start" style={btnSecondary}>
              🔄 Reconnecter (changer de compte)
            </a>
            <button type="button" onClick={disconnect} disabled={pending} style={btnDanger(pending)}>
              {pending ? 'Déconnexion…' : 'Déconnecter Gmail'}
            </button>
          </div>
        </>
      ) : (
        <>
          <p style={{ margin: 0, marginBottom: '0.75rem', fontSize: '0.9rem', color: '#666' }}>
            ⓘ Aucun compte Gmail connecté. Sans connexion, les courriels seront
            envoyés en direct (SMTP/Resend) sans étape de relecture.
          </p>
          <a href="/api/auth/google/start" style={btnPrimary}>
            🔗 Connecter un compte Gmail
          </a>
        </>
      )}
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.6rem 1.2rem',
  background: '#1565c0',
  color: 'white',
  border: 0,
  borderRadius: 4,
  textDecoration: 'none',
  fontSize: '0.95rem',
  fontWeight: 600,
};
const btnSecondary: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.5rem 1rem',
  background: 'white',
  color: '#1565c0',
  border: '1px solid #1565c0',
  borderRadius: 4,
  textDecoration: 'none',
  fontSize: '0.85rem',
};
const btnDanger = (pending: boolean): React.CSSProperties => ({
  padding: '0.5rem 1rem',
  background: 'transparent',
  color: '#c62828',
  border: '1px solid #ef9a9a',
  borderRadius: 4,
  cursor: pending ? 'wait' : 'pointer',
  fontSize: '0.85rem',
});
