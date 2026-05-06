import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { EquipeForm } from '../../equipe-form';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function EditEquipePage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const workshop = await getActiveWorkshop();
  if (!workshop) return <p>Aucun workshop actif.</p>;

  const m = await prisma.equipeMember.findFirst({
    where: { id, workshopId: workshop.id },
  });
  if (!m) notFound();

  return (
    <div style={{ maxWidth: 720 }}>
      <Link href={`/${locale}/admin/equipe`} style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1rem' }}>← Toute l&apos;équipe</Link>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Modifier {m.prenom} {m.nom}</h1>
      <EquipeForm initial={m} />
    </div>
  );
}
