import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

type Check = {
  label: string;
  ok: boolean;
  detail: string;
};

/**
 * Diagnostic public — état des env vars critiques + ping DB.
 * Affiche **uniquement** des booléens / messages, jamais les valeurs des
 * env vars. Sûr à laisser public.
 *
 * Cette page contourne complètement AdminLayout / auth Clerk / DB
 * d'utilisateur — donc elle reste accessible même quand /admin/*
 * crashe en preview Vercel. Permet de comprendre pourquoi.
 */
export default async function HealthPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const env = {
    clerkPub: !!process.env['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'],
    clerkSecret: !!process.env['CLERK_SECRET_KEY'],
    databaseUrl: !!process.env['DATABASE_URL'],
    googleClientId: !!process.env['GOOGLE_CLIENT_ID'],
    googleClientSecret: !!process.env['GOOGLE_CLIENT_SECRET'],
    blobToken: !!process.env['BLOB_READ_WRITE_TOKEN'],
    nodeEnv: process.env.NODE_ENV ?? 'unknown',
    vercelEnv: process.env['VERCEL_ENV'] ?? 'local',
  };

  const checks: Check[] = [
    {
      label: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      ok: env.clerkPub,
      detail: env.clerkPub ? 'présent' : 'manquant — auth Clerk désactivée',
    },
    {
      label: 'CLERK_SECRET_KEY',
      ok: env.clerkSecret,
      detail: env.clerkSecret ? 'présent' : 'manquant — auth() server crashera',
    },
    {
      label: 'DATABASE_URL',
      ok: env.databaseUrl,
      detail: env.databaseUrl ? 'présent' : 'manquant — Prisma fail',
    },
    {
      label: 'GOOGLE_CLIENT_ID',
      ok: env.googleClientId,
      detail: env.googleClientId ? 'présent' : 'manquant — OAuth Gmail HS',
    },
    {
      label: 'GOOGLE_CLIENT_SECRET',
      ok: env.googleClientSecret,
      detail: env.googleClientSecret ? 'présent' : 'manquant — OAuth Gmail HS',
    },
    {
      label: 'BLOB_READ_WRITE_TOKEN',
      ok: env.blobToken,
      detail: env.blobToken ? 'présent' : 'manquant — photos Vercel Blob HS',
    },
  ];

  // Ping DB — capture l'erreur pour ne pas crash la page diagnostic.
  let dbCheck: Check;
  try {
    if (!env.databaseUrl) {
      dbCheck = { label: 'DB ping', ok: false, detail: 'DATABASE_URL manquant — skip' };
    } else {
      const start = Date.now();
      const r = await prisma.$queryRaw<Array<{ now: Date }>>`SELECT NOW() as now`;
      const ms = Date.now() - start;
      dbCheck = {
        label: 'DB ping',
        ok: true,
        detail: `OK (${ms}ms) — ${r[0]?.now.toISOString() ?? 'no row'}`,
      };
    }
  } catch (e) {
    dbCheck = {
      label: 'DB ping',
      ok: false,
      detail: `error: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  return (
    <main
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '3rem 1.5rem',
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        background: '#fafafa',
        minHeight: '100vh',
        color: '#1a1a1a',
      }}
    >
      <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>
        Diagnostic Flex
      </h1>
      <p style={{ color: 'rgba(0,0,0,0.6)', marginBottom: '2rem', fontSize: '0.95rem' }}>
        État des dépendances critiques. Booléens uniquement — pas de valeurs sensibles.
      </p>

      <Section title="Environnement">
        <Row label="NODE_ENV" value={env.nodeEnv} />
        <Row label="VERCEL_ENV" value={env.vercelEnv} />
      </Section>

      <Section title="Variables d'environnement">
        {checks.map((c) => (
          <CheckRow key={c.label} check={c} />
        ))}
      </Section>

      <Section title="Base de données">
        <CheckRow check={dbCheck} />
      </Section>

      <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'rgba(0,0,0,0.5)' }}>
        Si un check est rouge, configurer la variable correspondante dans
        Vercel Project Settings → Environment Variables, en s&apos;assurant
        de cocher l&apos;environnement où le bug apparaît (Preview, Production,
        Development).
      </p>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2
        style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'rgba(0,0,0,0.5)',
          marginBottom: '0.6rem',
        }}
      >
        {title}
      </h2>
      <div
        style={{
          background: 'white',
          border: '1px solid rgba(0,0,0,0.1)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '0.6rem 1rem',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        fontSize: '0.9rem',
      }}
    >
      <code style={{ fontFamily: 'ui-monospace, monospace', color: 'rgba(0,0,0,0.7)' }}>
        {label}
      </code>
      <code style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}>{value}</code>
    </div>
  );
}

function CheckRow({ check }: { check: Check }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.6rem 1rem',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        fontSize: '0.9rem',
      }}
    >
      <span
        aria-label={check.ok ? 'ok' : 'erreur'}
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          flexShrink: 0,
          background: check.ok ? '#62e335' : '#d92020',
          boxShadow: check.ok ? '0 0 0 3px rgba(98,227,53,0.2)' : '0 0 0 3px rgba(217,32,32,0.2)',
        }}
      />
      <code style={{ fontFamily: 'ui-monospace, monospace', color: 'rgba(0,0,0,0.7)', minWidth: 220 }}>
        {check.label}
      </code>
      <span style={{ color: 'rgba(0,0,0,0.6)', fontSize: '0.85rem' }}>{check.detail}</span>
    </div>
  );
}
