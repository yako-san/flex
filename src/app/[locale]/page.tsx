import { setRequestLocale, getTranslations } from 'next-intl/server';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('Home');
  const tApp = await getTranslations('App');

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
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{tApp('title')}</h1>
      <p style={{ fontSize: '1.1rem', color: '#666', marginTop: 0 }}>{tApp('tagline')}</p>
      <hr style={{ margin: '2rem 0', border: 0, borderTop: '1px solid #eee' }} />
      <h2 style={{ fontSize: '1.5rem' }}>{t('welcome')}</h2>
      <p>{t('intro')}</p>
    </main>
  );
}
