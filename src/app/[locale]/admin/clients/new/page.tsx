import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { ClientForm } from '../client-form';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function NewClientPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div style={{ maxWidth: 720 }}>
      <Link
        href={`/${locale}/admin/clients`}
        style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1rem' }}
      >
        ← Tous les clients
      </Link>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Nouveau client</h1>
      <ClientForm />
    </div>
  );
}
