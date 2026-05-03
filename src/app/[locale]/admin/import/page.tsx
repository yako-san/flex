import { setRequestLocale } from 'next-intl/server';
import { ImportForm } from './import-form';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AdminImportPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Import dump v1</h1>
      <p style={{ color: '#666' }}>
        Upload du JSON exporté par l&apos;app v1. Crée un nouveau workshop + insère
        toutes les entités dans une transaction unique.
      </p>
      <hr style={{ margin: '2rem 0', border: 0, borderTop: '1px solid #eee' }} />
      <ImportForm />
    </div>
  );
}
