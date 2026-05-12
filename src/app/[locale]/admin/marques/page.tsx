import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export default async function MarquesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const workshop = await getActiveWorkshop();
  if (!workshop) return <p className="p-6 text-[var(--text-secondary-60)]">Aucun workshop actif.</p>;

  const marques = await prisma.marque.findMany({
    where: { workshopId: workshop.id, deletedAt: null },
    orderBy: { nom: 'asc' },
    include: { _count: { select: { velos: true } } },
  });

  return (
    <div>
      <PageHeader
        eyebrow="paramètres · catalogue vélo"
        title="Marques"
        subline={`${marques.length} marque${marques.length === 1 ? '' : 's'} disponible${marques.length === 1 ? '' : 's'} dans les dropdowns BDT`}
        actions={
          <Link
            href={`/${locale}/admin/marques/new`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--jaune)] text-black shadow-sm transition-colors hover:bg-[var(--jaune-h)]"
            aria-label="Nouvelle marque"
            title="Nouvelle marque"
          >
            <Plus size={20} />
          </Link>
        }
      />

      <div className="p-6">
        {marques.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--gris-bord)] p-8 text-center text-sm text-[var(--text-secondary-60)]">
            Aucune marque. Ajoute-en une avec le bouton + en haut à droite.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-white/85 shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--gris-bord)] bg-white/50 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
                <tr>
                  <th className="px-3 py-2 text-left">Nom</th>
                  <th className="px-3 py-2 text-left">Tailles disponibles</th>
                  <th className="px-3 py-2 text-right">Vélos</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {marques.map((m) => {
                  const tailles = Array.isArray(m.taillesDisponibles)
                    ? (m.taillesDisponibles as string[])
                    : [];
                  return (
                    <tr key={m.id} className="border-t border-[var(--gris-bord)]/30 hover:bg-[var(--gris-fond)]">
                      <td className="px-3 py-2 font-semibold">{m.nom}</td>
                      <td className="px-3 py-2">
                        {tailles.length > 0 ? (
                          <span className="flex flex-wrap gap-1">
                            {tailles.map((t) => (
                              <span key={t} className="rounded-full bg-[var(--gris-fond)] px-2 py-0.5 text-[10px] font-mono">
                                {t}
                              </span>
                            ))}
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--text-secondary-60)]">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{m._count.velos}</td>
                      <td className="px-3 py-2 text-right">
                        <Link
                          href={`/${locale}/admin/marques/${m.id}/edit`}
                          className="text-xs text-[var(--jaune-h)] hover:underline"
                        >
                          Modifier
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
