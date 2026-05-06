import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { EquipeForm } from '../equipe-form';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export default async function NewEquipePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div style={{ maxWidth: 720 }}>
      <Link href={`/${locale}/admin/equipe`} style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1rem' }}>← Toute l&apos;équipe</Link>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Nouveau membre</h1>
      <EquipeForm />
    </div>
  );
}
