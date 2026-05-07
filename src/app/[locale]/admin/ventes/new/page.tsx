import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { VenteForm } from './vente-form';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export default async function NewVentePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const workshop = await getActiveWorkshop();
  if (!workshop) return <p>Aucun workshop actif.</p>;

  const clients = await prisma.client.findMany({
    where: { workshopId: workshop.id, deletedAt: null },
    orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
    select: { id: true, prenom: true, nom: true },
  });

  return (
    <div style={{ maxWidth: 720 }}>
      <Link
        href={`/${locale}/admin/ventes`}
        style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1rem' }}
      >
        ← Toutes les ventes
      </Link>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Nouvelle vente comptoir</h1>
      <p style={{ color: '#666', marginTop: 0, marginBottom: '1.5rem' }}>
        Crée la vente vide, puis ajoute des pièces au prix catalogue. Émets la facture quand prêt.
      </p>
      <VenteForm clients={clients} />
    </div>
  );
}
