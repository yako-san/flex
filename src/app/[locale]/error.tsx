'use client';

import { useEffect } from 'react';

/**
 * Error boundary de la couche [locale]. Capture toute erreur de
 * layout/page enfant (admin/, dashboard/, etc.) — y compris les
 * exceptions d'AdminLayout (auth Clerk, getActiveWorkshop, etc.).
 *
 * Pas de <html>/<body> ici : ces tags sont posés par le layout parent
 * `[locale]/layout.tsx` (NextIntl + Clerk providers conditionnels). Ce
 * boundary est rendu DANS ce layout.
 *
 * Pour les erreurs survenant DANS le layout root lui-même, voir
 * `src/app/global-error.tsx` qui pose son propre <html>/<body>.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[LocaleError]', error);
  }, [error]);

  return (
    <main
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '3rem 1.5rem',
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        minHeight: '100vh',
      }}
    >
      <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>
        Une erreur est survenue
      </h1>
      <p style={{ color: 'rgba(0,0,0,0.6)', marginBottom: '2rem', fontSize: '0.95rem' }}>
        Le serveur a renvoyé une exception au render. Voici le détail —
        partage-le si tu demandes de l&apos;aide.
      </p>

      <Section title="Digest Next.js">
        <code style={codeStyle}>{error.digest ?? 'aucun digest'}</code>
      </Section>

      <Section title="Message">
        <code style={codeStyle}>{error.message || '(masqué par Next en production)'}</code>
      </Section>

      <Section title="Causes les plus fréquentes">
        <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.7 }}>
          <li>
            <strong>Variables d&apos;environnement manquantes</strong> sur
            le déploiement Vercel courant (Preview / Production).{' '}
            <a href="/fr-CA/dev/health" style={linkStyle}>Voir /dev/health</a>.
          </li>
          <li>
            <strong>Session Clerk absente</strong> — sur les preview URLs,
            les cookies Clerk de la prod ne sont pas partagés. Ouvrir{' '}
            <a href="/fr-CA/dev/ui-kit" style={linkStyle}>/dev/ui-kit</a>{' '}
            pour bypass auth.
          </li>
          <li>
            <strong>DB inaccessible</strong> — Neon en sleep, IP non whitelistée,
            ou <code style={inlineCode}>DATABASE_URL</code> pointant vers
            le mauvais projet (flex-v2 dev vs flex-prod main).
          </li>
          <li>
            <strong>Migration Prisma non appliquée</strong> — schema en
            avance sur la DB.
          </li>
        </ul>
      </Section>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
        <button type="button" onClick={() => reset()} style={btnPrimary}>
          Réessayer
        </button>
        <a href="/fr-CA/dev/health" style={btnSecondary}>
          Diagnostic env
        </a>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '1.25rem' }}>
      <h3
        style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'rgba(0,0,0,0.5)',
          marginBottom: '0.4rem',
        }}
      >
        {title}
      </h3>
      <div>{children}</div>
    </section>
  );
}

const codeStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: '0.8rem',
  background: 'rgba(0,0,0,0.05)',
  padding: '0.6rem 0.8rem',
  borderRadius: 6,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
};

const inlineCode: React.CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: '0.78rem',
  background: 'rgba(0,0,0,0.05)',
  padding: '0.05rem 0.35rem',
  borderRadius: 3,
  margin: '0 0.15rem',
};

const linkStyle: React.CSSProperties = {
  color: '#1565c0',
  textDecoration: 'underline',
};

const btnPrimary: React.CSSProperties = {
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
};

const btnSecondary: React.CSSProperties = {
  padding: '0.5rem 1.25rem',
  border: '2px solid rgba(0,0,0,0.5)',
  borderRadius: 30,
  color: '#000',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  fontSize: '0.85rem',
  textDecoration: 'none',
};
