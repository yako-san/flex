import { auth } from '@clerk/nextjs/server';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

type Props = {
  params: Promise<{ locale: string }>;
};

// auth() lit la session via cookies/headers : la page doit être dynamique,
// sinon Next.js essaie de la prérendre au build et Clerk explose (pas de
// contexte request).
export const dynamic = 'force-dynamic';

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { userId } = await auth();
  if (!userId) redirect(`/${locale}/sign-in`);

  const tApp = await getTranslations('App');
  const t = await getTranslations('Dashboard');

  return (
    <main
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        maxWidth: 960,
        margin: '4rem auto',
        padding: '0 1.5rem',
        lineHeight: 1.6,
        color: '#1a1a1a',
      }}
    >
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{tApp('title')}</h1>
      <p style={{ color: '#666' }}>{t('signedInAs', { userId })}</p>
      <hr style={{ margin: '2rem 0', border: 0, borderTop: '1px solid #eee' }} />
      <p>{t('placeholder')}</p>
    </main>
  );
}
