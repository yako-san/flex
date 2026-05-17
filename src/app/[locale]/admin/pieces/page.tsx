import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';
import { Pill } from '@/components/ui/pill';
import { ToolbarBlock, AddButton } from '@/components/ui/toolbar';
import { SearchBar } from '../_components/search-bar';

type CmdVariant = 'cmd-recue' | 'cmd-listee' | 'cmd-a-cmder' | 'cmd-estimee';

function stockStatus(physique: number, reserve: number): { variant: CmdVariant; label: string; title: string } {
  const dispo = physique - reserve;
  if (physique <= 0)          return { variant: 'cmd-estimee', label: '…',  title: 'Stock épuisé — à commander' };
  if (dispo <= 0)             return { variant: 'cmd-a-cmder', label: '—',  title: 'Tout réservé sur BDT en cours' };
  if (physique <= 2)          return { variant: 'cmd-listee',  label: '√',  title: 'Stock faible (≤ 2)' };
  return                            { variant: 'cmd-recue',   label: '√',  title: `${dispo} en stock` };
}

type PieceLite = {
  id: string;
  legacyCode: string | null;
  sku: string | null;
  nomCanonical: string;
  fournisseur: string | null;
  categorie: string | null;
  prixVente: { toString(): string };
  stockPhysique: number;
  stockReserve: number;
};

function PieceRow({ p, view, locale }: { p: PieceLite; view: 'catalogue' | 'fournisseurs'; locale: string }) {
  const st = stockStatus(p.stockPhysique, p.stockReserve);
  return (
    <tr className="odd:bg-white/85 even:bg-white/70 border-t border-black/5 hover:bg-[var(--gris-fond)]">
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
      <td className="px-3 py-1.5 text-center">
        <Pill variant={st.variant} size="sm" title={st.title}>{st.label}</Pill>
      </td>
      <td className="px-3 py-1.5 text-right">
        <Link href={`/${locale}/admin/pieces/${p.id}/edit`} className="text-[11px] text-[var(--jaune-h)] hover:underline">
          Modifier
        </Link>
      </td>
    </tr>
  );
}

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
        ? [{ fournisseur: 'asc' }, { categorie: 'asc' }, { groupe: 'asc' }, { nomCanonical: 'asc' }]
        : [{ categorie: 'asc' }, { groupe: 'asc' }, { nomCanonical: 'asc' }],
  });

  // Grouper selon la vue principale (catégorie ou fournisseur)
  const groups = new Map<string, typeof pieces>();
  const groupKey = (p: (typeof pieces)[number]) =>
    view === 'fournisseurs' ? p.fournisseur || '(Sans fournisseur)' : p.categorie || '(Sans catégorie)';
  for (const p of pieces) {
    const key = groupKey(p);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)?.push(p);
  }
  const orderedGroups = Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b, 'fr'));

  // Sous-groupage par `groupe` (uniquement vue catalogue, V1 « Fourche / Guidons / Jeu de direction »
  // sous « 1. Direction »). En vue fournisseurs, V1 affiche une liste plate.
  function subGroupByGroupe(list: typeof pieces): Map<string, typeof pieces> {
    const sub = new Map<string, typeof pieces>();
    for (const p of list) {
      const k = p.groupe?.trim() || '';
      if (!sub.has(k)) sub.set(k, []);
      sub.get(k)?.push(p);
    }
    return sub;
  }

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
        title={
          <>
            Pièces{' '}
            <span className="opacity-70" style={{ fontSize: '0.6em' }}>
              : {view === 'fournisseurs' ? 'fournisseurs' : 'catalogue'}
            </span>
          </>
        }
        subline={`${pieces.length} pièce${pieces.length === 1 ? '' : 's'}${trimmed ? ` filtré sur « ${trimmed} »` : ''}`}
        actions={
          <ToolbarBlock>
            <SearchBar placeholder="SKU, code-barre, nom, catégorie…" />
            <a href="/api/admin/export/pieces" className="btn-secondary" style={{ height: '32px', padding: '0 14px', fontSize: '11px' }}>
              ↓ CSV
            </a>
            <a
              href={`/api/admin/export/labels${trimmed ? `?categorie=${encodeURIComponent(trimmed)}` : '?withSku=1'}`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
              style={{ height: '32px', padding: '0 14px', fontSize: '11px' }}
              title="Étiquettes imprimables A4 avec code-barre"
            >
              Étiquettes
            </a>
            <AddButton href={`/${locale}/admin/pieces/new`} title="Nouvelle pièce" />
          </ToolbarBlock>
        }
      />

      <div className="bloc-contenu p-6">
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
            {orderedGroups.map(([groupName, items], gIdx) => {
              const subGroups = view === 'catalogue' ? subGroupByGroupe(items) : null;
              const hasSubGroups =
                subGroups !== null &&
                subGroups.size > 1 &&
                !(subGroups.size === 1 && subGroups.has(''));
              return (
                <details key={groupName} open className="overflow-x-auto rounded-2xl shadow-sm">
                  <summary
                    className="flex cursor-pointer items-center justify-between bg-[var(--jaune)] px-4 py-2 text-sm font-semibold text-black"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-xs opacity-60">{view === 'fournisseurs' ? '📦' : '⚙'}</span>
                      <span>
                        {view === 'catalogue' ? `${gIdx + 1}. ${groupName}` : groupName}
                      </span>
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
                          <th className="px-3 py-1.5 text-center">Statut</th>
                          <th className="px-3 py-1.5" />
                        </tr>
                      </thead>
                      <tbody>
                        {hasSubGroups
                          ? Array.from(subGroups!.entries())
                              .sort(([a], [b]) => a.localeCompare(b, 'fr'))
                              .flatMap(([subName, subList]) => [
                                subName ? (
                                  <tr key={`__sub-${groupName}-${subName}`} className="bg-[var(--gris-fond)]">
                                    <td colSpan={9} className="px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-secondary-70)]">
                                      {subName}
                                      <span className="ml-2 font-normal opacity-60">({subList.length})</span>
                                    </td>
                                  </tr>
                                ) : null,
                                ...subList.map((p) => <PieceRow key={p.id} p={p} view={view} locale={locale} />),
                              ])
                          : items.map((p) => <PieceRow key={p.id} p={p} view={view} locale={locale} />)}
                      </tbody>
                    </table>
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
