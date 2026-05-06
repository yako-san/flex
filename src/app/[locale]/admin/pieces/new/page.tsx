import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { PieceForm } from '../piece-form';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export default async function NewPiecePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div style={{ maxWidth: 900 }}>
      <Link href={`/${locale}/admin/pieces`} style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1rem' }}>← Toutes les pièces</Link>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Nouvelle pièce</h1>
      <PieceForm />
    </div>
  );
}
