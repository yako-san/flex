import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { Package, Wrench } from 'lucide-react';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';
import { ToolbarBlock, AddButton } from '@/components/ui/toolbar';
import { SearchBar } from '../_components/search-bar';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string }> };

export default async function ServicesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { q } = await searchParams;
  setRequestLocale(locale);
  const workshop = await getActiveWorkshop();
  if (!workshop) return <p className="p-6 text-[var(--text-secondary-60)]">Aucun workshop actif.</p>;

  const trimmed = q?.trim() ?? '';
  const textFilter = trimmed
    ? {
        OR: [
          { labelCanonical: { contains: trimmed, mode: Prisma.QueryMode.insensitive } },
          { legacyCode: { contains: trimmed, mode: Prisma.QueryMode.insensitive } },
          { categorie: { contains: trimmed, mode: Prisma.QueryMode.insensitive } },
        ],
      }
    : {};

  const [forfaits, services] = await Promise.all([
    prisma.forfait.findMany({
      where: { workshopId: workshop.id, deletedAt: null, ...textFilter },
      orderBy: [{ legacyCode: 'asc' }, { labelCanonical: 'asc' }],
      include: { _count: { select: { taskTemplates: true } } },
    }),
    prisma.service.findMany({
      where: { workshopId: workshop.id, deletedAt: null, ...textFilter },
      orderBy: [{ categorie: 'asc' }, { labelCanonical: 'asc' }],
    }),
  ]);

  // Grouper services par catégorie
  const grouped = new Map<string, typeof services>();
  for (const s of services) {
    const key = s.categorie || '(Sans catégorie)';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)?.push(s);
  }
  const orderedCats = Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b, 'fr'));

  return (
    <div>
      <PageHeader
        eyebrow="catalogue à la carte"
        title="Services"
        subline={`${forfaits.length} forfait${forfaits.length === 1 ? '' : 's'} · ${services.length} service${services.length === 1 ? '' : 's'} à la carte`}
        actions={
          <ToolbarBlock>
            <SearchBar placeholder="Code, libellé, catégorie…" />
            <Link href={`/${locale}/admin/forfaits/new`} className="btn-secondary" style={{ height: '32px', padding: '0 14px', fontSize: '11px' }}>
              + Forfait
            </Link>
            <AddButton href={`/${locale}/admin/services/new`} title="Nouveau service" />
          </ToolbarBlock>
        }
      />

      <div className="space-y-4 p-6">
        {/* Section Forfaits */}
        <details open className="overflow-hidden rounded-2xl shadow-sm">
          <summary className="flex cursor-pointer items-center justify-between bg-[var(--jaune)] px-4 py-2 text-sm font-semibold text-black">
            <span className="flex items-center gap-2">
              <Package size={16} />
              <span>Forfaits</span>
              <span className="text-xs opacity-60">{forfaits.length}</span>
            </span>
          </summary>
          <div className="bg-white/85">
            {forfaits.length === 0 ? (
              <p className="px-4 py-4 text-center text-xs italic text-[var(--text-secondary-60)]">
                Aucun forfait.
              </p>
            ) : (
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
                    <tr key={f.id} className="odd:bg-white/85 even:bg-white/70 border-t border-black/5 hover:bg-[var(--gris-fond)]">
                      <td className="px-3 py-1.5 font-mono text-[10px] text-[var(--text-secondary-60)]">{f.legacyCode ?? '—'}</td>
                      <td className="px-3 py-1.5 font-semibold">{f.labelCanonical}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">
                        {f.dureeMinutes ? `${f.dureeMinutes} min` : '—'}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{f._count.taskTemplates}</td>
                      <td className="px-3 py-1.5 text-right font-mono tabular-nums">{Number(f.prix).toFixed(2)} $</td>
                      <td className="px-3 py-1.5 text-center">{f.taxable ? '✓' : '—'}</td>
                      <td className="px-3 py-1.5 text-right">
                        <Link href={`/${locale}/admin/forfaits/${f.id}/edit`} className="text-[11px] text-[var(--jaune-h)] hover:underline">
                          Modifier
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </details>

        {/* Section Services à la carte */}
        <details open className="overflow-hidden rounded-2xl shadow-sm">
          <summary className="flex cursor-pointer items-center justify-between bg-[var(--jaune)] px-4 py-2 text-sm font-semibold text-black">
            <span className="flex items-center gap-2">
              <Wrench size={16} />
              <span>Services — À la carte</span>
              <span className="text-xs opacity-60">{services.length}</span>
            </span>
          </summary>
          <div className="bg-white/85">
            {services.length === 0 ? (
              <p className="px-4 py-4 text-center text-xs italic text-[var(--text-secondary-60)]">
                Aucun service.
              </p>
            ) : (
              orderedCats.map(([cat, list]) => (
                <div key={cat}>
                  <div className="bg-[var(--gris-fond)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-secondary-60)]">
                    {cat} <span className="ml-2 font-normal opacity-60">({list.length})</span>
                  </div>
                  <table className="w-full text-xs">
                    <tbody>
                      {list.map((s) => (
                        <tr key={s.id} className="odd:bg-white/85 even:bg-white/70 border-t border-black/5 hover:bg-[var(--gris-fond)]">
                          <td className="px-3 py-1.5 font-mono text-[10px] text-[var(--text-secondary-60)] w-[60px]">{s.legacyCode ?? '—'}</td>
                          <td className="px-3 py-1.5">{s.labelCanonical}</td>
                          <td className="px-3 py-1.5 text-right tabular-nums w-[80px]">
                            {s.dureeMinutes ? `${s.dureeMinutes} min` : '—'}
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono tabular-nums w-[90px]">{Number(s.prix).toFixed(2)} $</td>
                          <td className="px-3 py-1.5 text-center w-[60px]">{s.taxable ? '✓' : '—'}</td>
                          <td className="px-3 py-1.5 text-right w-[80px]">
                            <Link href={`/${locale}/admin/services/${s.id}/edit`} className="text-[11px] text-[var(--jaune-h)] hover:underline">
                              Modifier
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </div>
        </details>
      </div>
    </div>
  );
}
