import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/ui/page-header';
import { ClientForm } from '../client-form';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function NewClientPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div>
      <PageHeader
        eyebrow="atelier · nouveau client"
        title="Nouveau client"
      />
      <div className="bloc-contenu mx-auto max-w-[720px] p-6">
        <Link
          href={`/${locale}/admin/clients`}
          className="mb-4 inline-block text-sm text-[var(--text-secondary-60)] hover:text-[var(--dark)]"
        >
          ← Tous les clients
        </Link>
        <ClientForm />
      </div>
    </div>
  );
}
