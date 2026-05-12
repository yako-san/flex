import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';
import { AdhocForm } from './adhoc-form';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export default async function NewAdhocPoPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const workshop = await getActiveWorkshop();
  if (!workshop) return <p>Aucun workshop actif.</p>;

  const pieces = await prisma.piece.findMany({
    where: { workshopId: workshop.id, deletedAt: null },
    orderBy: [{ nomCanonical: 'asc' }],
    select: { id: true, nomCanonical: true, sku: true },
  });

  // Liste distincte de catégories pour le datalist
  const cats = await prisma.piece.findMany({
    where: { workshopId: workshop.id, deletedAt: null, categorie: { not: null } },
    select: { categorie: true },
    distinct: ['categorie'],
    orderBy: { categorie: 'asc' },
  });
  const categories = cats
    .map((c) => c.categorie)
    .filter((c): c is string => typeof c === 'string' && c.trim() !== '');

  return (
    <div>
      <PageHeader
        eyebrow="commandes fournisseurs · adhoc"
        title="Réception ADHOC"
        subline="PO pré-marqué REÇU pour pièces achetées sans commande préalable. Le stock physique est incrémenté immédiatement."
      />
      <div className="mx-auto max-w-[920px] p-6">
        <Link
          href={`/${locale}/admin/pos`}
          className="mb-4 inline-block text-sm text-[var(--text-secondary-60)] hover:text-[var(--dark)]"
        >
          ← Tous les POs
        </Link>
        <AdhocForm pieces={pieces} categories={categories} />
      </div>
    </div>
  );
}
