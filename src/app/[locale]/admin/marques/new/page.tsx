import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/ui/page-header';
import { MarqueForm } from '../marque-form';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export default async function NewMarquePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div>
      <PageHeader
        eyebrow="paramètres · nouvelle marque"
        title="Nouvelle marque"
      />
      <div className="mx-auto max-w-[720px] p-6">
        <Link href={`/${locale}/admin/marques`} className="mb-4 inline-block text-sm text-[var(--text-secondary-60)] hover:text-[var(--dark)]">← Toutes les marques</Link>
        <MarqueForm />
      </div>
    </div>
  );
}
