import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/ui/page-header';
import { ImportClientsPage } from './import-client';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export default async function ImportClientsRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div>
      <PageHeader
        eyebrow="atelier · import"
        title="Import CSV de clients"
        subline="Détection auto des colonnes, ajustement manuel, anti-doublons sur (prénom + nom) ou courriel."
      />
      <div className="bloc-contenu mx-auto max-w-[960px] p-6">
        <Link
          href={`/${locale}/admin/clients`}
          className="mb-4 inline-block text-sm text-[var(--text-secondary-60)] hover:text-[var(--dark)]"
        >
          ← Tous les clients
        </Link>
        <ImportClientsPage />
      </div>
    </div>
  );
}
