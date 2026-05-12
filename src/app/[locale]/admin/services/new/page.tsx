import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/ui/page-header';
import { ServiceForm } from '../service-form';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export default async function NewServicePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div>
      <PageHeader
        eyebrow="catalogue à la carte · nouveau service"
        title="Nouveau service"
      />
      <div className="mx-auto max-w-[800px] p-6">
        <Link href={`/${locale}/admin/services`} className="mb-4 inline-block text-sm text-[var(--text-secondary-60)] hover:text-[var(--dark)]">← Tous les services</Link>
        <ServiceForm />
      </div>
    </div>
  );
}
