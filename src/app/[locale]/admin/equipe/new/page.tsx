import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/ui/page-header';
import { EquipeForm } from '../equipe-form';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export default async function NewEquipePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div>
      <PageHeader
        eyebrow="paramètres · nouveau membre d'équipe"
        title="Nouveau membre"
      />
      <div className="bloc-contenu mx-auto max-w-[720px] p-6">
        <Link href={`/${locale}/admin/equipe`} className="mb-4 inline-block text-sm text-[var(--text-secondary-60)] hover:text-[var(--dark)]">← Toute l&apos;équipe</Link>
        <EquipeForm />
      </div>
    </div>
  );
}
