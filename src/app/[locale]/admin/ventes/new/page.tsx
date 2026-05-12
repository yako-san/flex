import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';
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
    <div>
      <PageHeader
        eyebrow="comptoir · nouvelle vente"
        title="Nouvelle vente comptoir"
        subline="Crée la vente vide, puis ajoute des pièces au prix catalogue. Émets la facture quand prêt."
      />
      <div className="mx-auto max-w-[720px] p-6">
        <Link
          href={`/${locale}/admin/ventes`}
          className="mb-4 inline-block text-sm text-[var(--text-secondary-60)] hover:text-[var(--dark)]"
        >
          ← Toutes les ventes
        </Link>
        <VenteForm clients={clients} />
      </div>
    </div>
  );
}
