import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { ImportClientsPage } from './import-client';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export default async function ImportClientsRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div style={{ maxWidth: 960 }}>
      <Link
        href={`/${locale}/admin/clients`}
        style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1rem' }}
      >
        ← Tous les clients
      </Link>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Import CSV de clients</h1>
      <p style={{ color: '#666', marginTop: 0, marginBottom: '1.5rem' }}>
        Importe une liste de clients depuis un fichier CSV (export Excel,
        Google Sheets, Numbers, ou autre logiciel). Détection auto des colonnes,
        ajustement manuel possible, anti-doublons sur (prénom + nom) ou courriel.
      </p>
      <ImportClientsPage />
    </div>
  );
}
