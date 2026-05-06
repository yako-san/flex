import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { ServiceForm } from '../service-form';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export default async function NewServicePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div style={{ maxWidth: 800 }}>
      <Link href={`/${locale}/admin/services`} style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1rem' }}>← Tous les services</Link>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Nouveau service</h1>
      <ServiceForm />
    </div>
  );
}
