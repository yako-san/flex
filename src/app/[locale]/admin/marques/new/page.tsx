import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { MarqueForm } from '../marque-form';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export default async function NewMarquePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div style={{ maxWidth: 600 }}>
      <Link href={`/${locale}/admin/marques`} style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1rem' }}>← Toutes les marques</Link>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Nouvelle marque</h1>
      <MarqueForm />
    </div>
  );
}
