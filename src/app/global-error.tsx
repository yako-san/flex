'use client';

import { useEffect } from 'react';

/**
 * Fallback ULTIME : capture les erreurs survenant dans le root layout
 * (`src/app/layout.tsx`) ou le layout `[locale]/layout.tsx` (NextIntl /
 * ClerkProvider). Doit poser son propre <html>/<body> car les layouts
 * normaux ne sont pas rendus.
 *
 * En cas d'erreur ici, l'app entière est probablement HS — on affiche
 * juste un message minimal et un lien diagnostic.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          padding: 0,
          minHeight: '100vh',
          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          background: '#fafafa',
          color: '#1a1a1a',
        }}
      >
        <main
          style={{
            maxWidth: 720,
            margin: '0 auto',
            padding: '3rem 1.5rem',
          }}
        >
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>
            Erreur critique
          </h1>
          <p style={{ color: 'rgba(0,0,0,0.6)', marginBottom: '2rem', fontSize: '0.95rem' }}>
            Le layout racine a renvoyé une exception. Probablement une variable
            d&apos;environnement manquante ou un service externe indisponible.
          </p>

          <div
            style={{
              background: 'rgba(0,0,0,0.05)',
              padding: '0.75rem 1rem',
              borderRadius: 8,
              marginBottom: '1rem',
              fontSize: '0.85rem',
            }}
          >
            <div style={{ marginBottom: '0.4rem', color: 'rgba(0,0,0,0.5)' }}>Digest</div>
            <code style={{ fontFamily: 'ui-monospace, monospace' }}>
              {error.digest ?? 'aucun'}
            </code>
          </div>
          <div
            style={{
              background: 'rgba(0,0,0,0.05)',
              padding: '0.75rem 1rem',
              borderRadius: 8,
              marginBottom: '2rem',
              fontSize: '0.85rem',
            }}
          >
            <div style={{ marginBottom: '0.4rem', color: 'rgba(0,0,0,0.5)' }}>Message</div>
            <code style={{ fontFamily: 'ui-monospace, monospace', wordBreak: 'break-word' }}>
              {error.message || '(masqué par Next en production)'}
            </code>
          </div>

          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: '0.5rem 1.25rem',
              border: 0,
              borderRadius: 30,
              background: '#fff056',
              color: '#000',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Réessayer
          </button>
        </main>
      </body>
    </html>
  );
}
