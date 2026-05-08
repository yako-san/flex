import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
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
    <div style={{ maxWidth: 920 }}>
      <Link
        href={`/${locale}/admin/pos`}
        style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1rem' }}
      >
        ← Tous les POs
      </Link>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Réception ADHOC</h1>
      <p style={{ color: '#666', marginTop: 0, marginBottom: '1.5rem' }}>
        Crée un PO pré-marqué <strong>RECU</strong> directement à la réception
        de pièces sans commande préalable (achat impulsif, dépannage, retour
        chez le fournisseur). Le stock physique est incrémenté immédiatement.
      </p>
      <AdhocForm pieces={pieces} categories={categories} />
    </div>
  );
}
