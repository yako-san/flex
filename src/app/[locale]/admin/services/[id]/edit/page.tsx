import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { ServiceForm } from '../../service-form';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function EditServicePage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const workshop = await getActiveWorkshop();
  if (!workshop) return <p>Aucun workshop actif.</p>;

  const s = await prisma.service.findFirst({
    where: { id, workshopId: workshop.id, deletedAt: null },
  });
  if (!s) notFound();

  return (
    <div style={{ maxWidth: 800 }}>
      <Link href={`/${locale}/admin/services`} style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1rem' }}>← Tous les services</Link>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Modifier {s.labelCanonical}</h1>
      <ServiceForm initial={s} />
    </div>
  );
}
