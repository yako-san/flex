import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/ui/page-header';
import { ForfaitForm } from '../forfait-form';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export default async function NewForfaitPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div>
      <PageHeader
        eyebrow="catalogue · nouveau forfait"
        title="Nouveau forfait"
      />
      <div className="mx-auto max-w-[800px] p-6">
        <Link href={`/${locale}/admin/forfaits`} className="mb-4 inline-block text-sm text-[var(--text-secondary-60)] hover:text-[var(--dark)]">← Tous les forfaits</Link>
        <ForfaitForm />
      </div>
    </div>
  );
}
