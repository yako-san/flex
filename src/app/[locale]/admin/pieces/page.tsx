import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { Prisma } from '@prisma/client';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';
import { SearchBar } from '../_components/search-bar';

export const dynamic = 'force-dynamic';

type Onglet = 'catalogue' | 'fournisseurs' | 'commandes' | 'reception';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; onglet?: string }>;
};

export default async function PiecesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { q, onglet } = await searchParams;
  setRequestLocale(locale);
  const workshop = await getActiveWorkshop();
  if (!workshop) return <p className="p-6 text-[var(--text-secondary-60)]">Aucun workshop actif.</p>;

  const view: Onglet = onglet === 'fournisseurs' ? 'fournisseurs' : 'catalogue';
  const trimmed = q?.trim() ?? '';
  const where: Prisma.PieceWhereInput = {
    workshopId: workshop.id,
    deletedAt: null,
    ...(trimmed
      ? {
          OR: [
            { sku: { contains: trimmed, mode: 'insensitive' } },
            { codeBarre: { contains: trimmed, mode: 'insensitive' } },
            { legacyCode: { contains: trimmed, mode: 'insensitive' } },
            { nomCanonical: { contains: trimmed, mode: 'insensitive' } },
            { categorie: { contains: trimmed, mode: 'insensitive' } },
            { fournisseur: { contains: trimmed, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const pieces = await prisma.piece.findMany({
    where,
    orderBy:
      view === 'fournisseurs'
        ? [{ fournisseur: 'asc' }, { categorie: 'asc' }, { nomCanonical: 'asc' }]
        : [{ categorie: 'asc' }, { nomCanonical: 'asc' }],
  });

  // Grouper selon la vue
  const groups = new Map<string, typeof pieces>();
  const groupKey = (p: (typeof pieces)[number]) =>
    view === 'fournisseurs' ? p.fournisseur || '(Sans fournisseur)' : p.categorie || '(Sans catégorie)';
  for (const p of pieces) {
    const key = groupKey(p);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)?.push(p);
  }
  const orderedGroups = Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b, 'fr'));

  const tabs: { value: Onglet; label: string; href: string }[] = [
    { value: 'catalogue', label: 'Catalogue', href: `/${locale}/admin/pieces?onglet=catalogue` },
    { value: 'fournisseurs', label: 'Fournisseurs', href: `/${locale}/admin/pieces?onglet=fournisseurs` },
    { value: 'commandes', label: 'Commandes', href: `/${locale}/admin/pos?status=open` },
    { value: 'reception', label: 'Réception', href: `/${locale}/admin/pos?status=partial` },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="catalogue atelier"
        title="Pièces"
        subline={`${pieces.length} pièce${pieces.length === 1 ? '' : 's'}${trimmed ? ` filtré sur « ${trimmed} »` : ''}`}
        actions={
          <>
            <SearchBar placeholder="SKU, code-barre, nom, catégorie…" />
            <a
              href="/api/admin/export/pieces"
              className="rounded-full border border-[var(--gris-bord)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary-60)] hover:bg-[var(--gris-fond)]"
            >
              ↓ CSV
            </a>
            <a
              href={`/api/admin/export/labels${trimmed ? `?categorie=${encodeURIComponent(trimmed)}` : '?withSku=1'}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[var(--gris-bord)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary-60)] hover:bg-[var(--gris-fond)]"
              title="Étiquettes imprimables A4 avec code-barre"
            >
              🏷️ Étiquettes
            </a>
            <Link
              href={`/${locale}/admin/pieces/new`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--jaune)] text-black shadow-sm transition-colors hover:bg-[var(--jaune-h)]"
              aria-label="Nouvelle pièce"
              title="Nouvelle pièce"
            >
              <Plus size={20} />
            </Link>
          </>
        }
      />

      <div className="p-6">
        {/* Pills toggle 4 onglets */}
        <nav className="mb-4 inline-flex gap-1 rounded-full bg-[rgba(0,0,0,0.20)] p-1">
          {tabs.map((t) => {
            const active = t.value === view;
            return (
              <Link
                key={t.value}
                href={t.href as never}
                className={`inline-flex h-8 items-center rounded-full px-4 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                  active
                    ? 'bg-[var(--jaune)] text-black'
                    : 'text-white/70 hover:bg-white/10'
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>

        {pieces.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--gris-bord)] p-8 text-center text-sm text-[var(--text-secondary-60)]">
            Aucune pièce {trimmed ? `pour « ${trimmed} »` : ''}.
          </p>
        ) : (
          <div className="space-y-4">
            {orderedGroups.map(([groupName, items]) => (
              <details key={groupName} open className="overflow-hidden rounded-2xl shadow-sm">
                <summary
                  className="flex cursor-pointer items-center justify-between bg-[var(--jaune)] px-4 py-2 text-sm font-semibold text-black"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-xs opacity-60">{view === 'fournisseurs' ? '📦' : '⚙'}</span>
                    <span>{groupName}</span>
                    <span className="text-xs opacity-60">{items.length}</span>
                  </span>
                </summary>
                <div className="bg-white/85">
                  <table className="w-full text-xs">
                    <thead className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
                      <tr>
                        <th className="px-3 py-1.5 text-left">Code</th>
                        <th className="px-3 py-1.5 text-left">SKU</th>
                        <th className="px-3 py-1.5 text-left">Nom</th>
                        {view === 'catalogue' ? (
                          <th className="px-3 py-1.5 text-left">Fournisseur</th>
                        ) : (
                          <th className="px-3 py-1.5 text-left">Catégorie</th>
                        )}
                        <th className="px-3 py-1.5 text-right">Prix vente</th>
                        <th className="px-3 py-1.5 text-right">Stock</th>
                        <th className="px-3 py-1.5 text-right">Réservé</th>
                        <th className="px-3 py-1.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((p) => (
                        <tr key={p.id} className="border-t border-black/5 hover:bg-[var(--gris-fond)]">
                          <td className="px-3 py-1.5 font-mono text-[10px] text-[var(--text-secondary-60)]">{p.legacyCode ?? '—'}</td>
                          <td className="px-3 py-1.5 font-mono">{p.sku ?? '—'}</td>
                          <td className="px-3 py-1.5">{p.nomCanonical}</td>
                          <td className="px-3 py-1.5 text-[var(--text-secondary-70)]">
                            {view === 'catalogue' ? (p.fournisseur ?? '—') : (p.categorie ?? '—')}
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono tabular-nums">{Number(p.prixVente).toFixed(2)} $</td>
                          <td className={`px-3 py-1.5 text-right font-mono tabular-nums ${p.stockPhysique < 0 ? 'text-[var(--rouge)] font-semibold' : ''}`}>
                            {p.stockPhysique}
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono tabular-nums text-[var(--text-secondary-60)]">{p.stockReserve}</td>
                          <td className="px-3 py-1.5 text-right">
                            <Link href={`/${locale}/admin/pieces/${p.id}/edit`} className="text-[11px] text-[var(--jaune-h)] hover:underline">
                              Modifier
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
