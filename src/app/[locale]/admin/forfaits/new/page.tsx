import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { ForfaitForm } from '../forfait-form';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export default async function NewForfaitPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div style={{ maxWidth: 800 }}>
      <Link href={`/${locale}/admin/forfaits`} style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1rem' }}>← Tous les forfaits</Link>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Nouveau forfait</h1>
      <ForfaitForm />
    </div>
  );
}
