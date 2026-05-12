import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { Plus, Package } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export default async function ForfaitsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const workshop = await getActiveWorkshop();
  if (!workshop) return <p className="p-6 text-[var(--text-secondary-60)]">Aucun workshop actif.</p>;

  const forfaits = await prisma.forfait.findMany({
    where: { workshopId: workshop.id, deletedAt: null },
    orderBy: [{ legacyCode: 'asc' }, { labelCanonical: 'asc' }],
    include: { _count: { select: { taskTemplates: true } } },
  });

  return (
    <div>
      <PageHeader
        eyebrow="catalogue · forfaits"
        title="Forfaits"
        subline={`${forfaits.length} forfait${forfaits.length === 1 ? '' : 's'} (services packagés avec sous-tâches)`}
        actions={
          <>
            <Link
              href={`/${locale}/admin/services`}
              className="rounded-full border border-[var(--gris-bord)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary-70)] hover:bg-[var(--gris-fond)]"
            >
              ← Hub services
            </Link>
            <Link
              href={`/${locale}/admin/forfaits/new`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--jaune)] text-black shadow-sm transition-colors hover:bg-[var(--jaune-h)]"
              aria-label="Nouveau forfait"
              title="Nouveau forfait"
            >
              <Plus size={20} />
            </Link>
          </>
        }
      />

      <div className="p-6">
        {forfaits.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--gris-bord)] p-8 text-center text-sm text-[var(--text-secondary-60)]">
            Aucun forfait. Crée-en un avec le bouton + en haut à droite.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white/85 shadow-sm">
            <header className="flex items-center justify-between bg-[var(--jaune)] px-4 py-2 text-sm font-semibold text-black">
              <span className="flex items-center gap-2">
                <Package size={16} />
                <span>Forfaits</span>
                <span className="text-xs opacity-60">{forfaits.length}</span>
              </span>
            </header>
            <table className="w-full text-xs">
              <thead className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
                <tr>
                  <th className="px-3 py-1.5 text-left">Code</th>
                  <th className="px-3 py-1.5 text-left">Libellé</th>
                  <th className="px-3 py-1.5 text-right">Durée</th>
                  <th className="px-3 py-1.5 text-right">Sous-tâches</th>
                  <th className="px-3 py-1.5 text-right">Prix HT</th>
                  <th className="px-3 py-1.5 text-center">Taxable</th>
                  <th className="px-3 py-1.5" />
                </tr>
              </thead>
              <tbody>
                {forfaits.map((f) => (
                  <tr key={f.id} className="border-t border-black/5 hover:bg-[var(--gris-fond)]">
                    <td className="px-3 py-1.5 font-mono text-[10px] text-[var(--text-secondary-60)]">{f.legacyCode ?? '—'}</td>
                    <td className="px-3 py-1.5 font-semibold">{f.labelCanonical}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">
                      {f.dureeMinutes ? `${f.dureeMinutes} min` : '—'}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{f._count.taskTemplates}</td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums">{Number(f.prix).toFixed(2)} $</td>
                    <td className="px-3 py-1.5 text-center">{f.taxable ? '✓' : '—'}</td>
                    <td className="px-3 py-1.5 text-right">
                      <Link
                        href={`/${locale}/admin/forfaits/${f.id}/edit`}
                        className="text-[11px] text-[var(--jaune-h)] hover:underline"
                      >
                        Modifier
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
