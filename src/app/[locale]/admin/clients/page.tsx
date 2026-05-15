import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';
import { ToolbarBlock, AddButton } from '@/components/ui/toolbar';
import { SearchBar } from '../_components/search-bar';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
};

export default async function ClientsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { q } = await searchParams;
  setRequestLocale(locale);

  const workshop = await getActiveWorkshop();
  if (!workshop) return <p className="p-6 text-[var(--text-secondary-60)]">Aucun workshop actif.</p>;

  const trimmed = q?.trim() ?? '';
  const where: Prisma.ClientWhereInput = {
    workshopId: workshop.id,
    deletedAt: null,
    ...(trimmed
      ? {
          OR: [
            { nom: { contains: trimmed, mode: 'insensitive' } },
            { prenom: { contains: trimmed, mode: 'insensitive' } },
            { courriel: { contains: trimmed, mode: 'insensitive' } },
            { telephone: { contains: trimmed, mode: 'insensitive' } },
            { notes: { contains: trimmed, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const clients = await prisma.client.findMany({
    where,
    orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
    include: { _count: { select: { velos: true } } },
  });

  // Grouper par première lettre du nom (sans accent)
  const grouped = new Map<string, typeof clients>();
  for (const c of clients) {
    const key = (c.nom || '?')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .charAt(0)
      .toUpperCase() || '?';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)?.push(c);
  }
  const groups = Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div>
      <PageHeader
        eyebrow="atelier"
        title="Clients"
        subline={`${clients.length} client${clients.length === 1 ? '' : 's'}${trimmed ? ` filtré sur « ${trimmed} »` : ''}`}
        actions={
          <ToolbarBlock>
            <SearchBar placeholder="Nom, courriel, tél, notes…" />
            <a href="/api/admin/export/clients" className="btn-secondary" style={{ height: '32px', padding: '0 14px', fontSize: '11px' }}>
              ↓ CSV
            </a>
            <Link href={`/${locale}/admin/clients/import`} className="btn-secondary" style={{ height: '32px', padding: '0 14px', fontSize: '11px' }}>
              ↑ Import
            </Link>
            <AddButton href={`/${locale}/admin/clients/new`} title="Nouveau client" />
          </ToolbarBlock>
        }
      />

      <div className="p-6">
        {clients.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--gris-bord)] p-8 text-center text-sm text-[var(--text-secondary-60)]">
            Aucun client {trimmed ? `pour « ${trimmed} »` : ''}.
          </p>
        ) : (
          <div className="space-y-6">
            {groups.map(([letter, list]) => (
              <section key={letter}>
                <h2 className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-secondary-60)]">
                  {letter} <span className="ml-2 font-normal opacity-60">({list.length})</span>
                </h2>
                <div className="overflow-x-auto rounded-2xl bg-white/85 shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="border-b border-[var(--gris-bord)] bg-white/50 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
                      <tr>
                        <th className="px-3 py-2 text-left">Nom</th>
                        <th className="px-3 py-2 text-left">Téléphone</th>
                        <th className="px-3 py-2 text-left">Courriel</th>
                        <th className="px-3 py-2 text-left">Lang</th>
                        <th className="px-3 py-2 text-left">Comm.</th>
                        <th className="px-3 py-2 text-left">Lead</th>
                        <th className="px-3 py-2 text-right">Remise</th>
                        <th className="px-3 py-2 text-right">Vélos</th>
                        <th className="px-3 py-2 text-left">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((c) => (
                        <tr key={c.id} className="border-t border-[var(--gris-bord)]/30 hover:bg-[var(--gris-fond)]">
                          <td className="px-3 py-2">
                            <Link href={`/${locale}/admin/clients/${c.id}`} className="font-semibold text-[var(--dark)] hover:underline">
                              {c.prenom} {c.nom}
                            </Link>
                          </td>
                          <td className="px-3 py-2 tabular-nums">
                            {c.telephone ? `${c.indicatif} ${c.telephone}` : '—'}
                          </td>
                          <td className="px-3 py-2 text-xs">{c.courriel ?? '—'}</td>
                          <td className="px-3 py-2">{c.lang}</td>
                          <td className="px-3 py-2 text-xs">{c.commPref}</td>
                          <td className="px-3 py-2 text-xs">{c.lead ?? '—'}</td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {c.remiseDefault ? `${Number(c.remiseDefault)} %` : '—'}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">{c._count.velos}</td>
                          <td className="px-3 py-2 max-w-[200px] truncate text-xs text-[var(--text-secondary-70)]" title={c.notes ?? ''}>
                            {c.notes ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
