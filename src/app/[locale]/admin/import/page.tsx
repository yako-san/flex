import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { ImportForm } from './import-form';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AdminImportPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { userId } = await auth();
  if (!userId) redirect(`/${locale}/sign-in`);

  return (
    <main
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        maxWidth: 720,
        margin: '4rem auto',
        padding: '0 1.5rem',
        lineHeight: 1.6,
        color: '#1a1a1a',
      }}
    >
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Import dump v1</h1>
      <p style={{ color: '#666' }}>
        Upload du JSON exporté par l&apos;app v1. Crée un nouveau workshop + insère
        toutes les entités dans une transaction unique.
      </p>
      <hr style={{ margin: '2rem 0', border: 0, borderTop: '1px solid #eee' }} />
      <ImportForm />
    </main>
  );
}
