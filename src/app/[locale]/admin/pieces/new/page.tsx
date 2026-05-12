import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/ui/page-header';
import { PieceForm } from '../piece-form';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export default async function NewPiecePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div>
      <PageHeader
        eyebrow="catalogue · nouvelle pièce"
        title="Nouvelle pièce"
      />
      <div className="mx-auto max-w-[900px] p-6">
        <Link href={`/${locale}/admin/pieces`} className="mb-4 inline-block text-sm text-[var(--text-secondary-60)] hover:text-[var(--dark)]">← Toutes les pièces</Link>
        <PieceForm />
      </div>
    </div>
  );
}
