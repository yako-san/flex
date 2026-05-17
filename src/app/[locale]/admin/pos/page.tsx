import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';
import { ToolbarBlock, AddButton } from '@/components/ui/toolbar';
import { SearchBar } from '../_components/search-bar';

export const dynamic = 'force-dynamic';

const STATUS_INFO: Record<string, { bg: string; fg: string; label: string }> = {
  EN_ATTENTE: { bg: 'var(--jaune)', fg: '#000', label: 'En attente' },
  PARTIEL:    { bg: 'var(--st-facture-bg)', fg: 'var(--st-facture-fg)', label: 'Partiel' },
  RECU:       { bg: 'var(--st-approuve-bg)', fg: 'var(--st-approuve-fg)', label: 'Reçu' },
  ANNULE:     { bg: 'var(--st-livre-bg)', fg: 'var(--st-livre-fg)', label: 'Annulé' },
};

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; vue?: string }>;
};

export default async function PosPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { q, vue } = await searchParams;
  setRequestLocale(locale);
  const workshop = await getActiveWorkshop();
  if (!workshop) return <p className="p-6 text-[var(--text-secondary-60)]">Aucun workshop actif.</p>;

  // V1 distingue Commande (cards par fournisseur, sliders qty, bouton « TRANSFÉRER EN
  // RÉCEPTION ») vs Réception (cards par PO, items à scanner, bouton « FINALISER »).
  // V2 expose les deux via le même `/admin/pos` mais avec un searchParam `vue`
  // qui pilote le titre, l'onglet actif et le filtre des statuts affichés.
  // - vue=commandes (défaut) : PO en EN_ATTENTE (pas encore parties chez le fournisseur)
  // - vue=reception          : PO en PARTIEL/RECU (livraisons en cours ou historique)
  const isReception = vue === 'reception';
  const vueActuelle: 'commandes' | 'reception' = isReception ? 'reception' : 'commandes';

  const trimmed = q?.trim() ?? '';
  const where: Prisma.PoWhereInput = {
    workshopId: workshop.id,
    deletedAt: null,
    ...(trimmed
      ? {
          OR: [
            { poNumero: { contains: trimmed, mode: 'insensitive' } },
            { fournisseur: { contains: trimmed, mode: 'insensitive' } },
            { notes: { contains: trimmed, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const pos = await prisma.po.findMany({
    where,
    orderBy: [{ dateCommande: 'desc' }],
    include: {
      items: {
        orderBy: { position: 'asc' },
        select: {
          id: true,
          qtyCommandee: true,
          qtyRecue: true,
          unitPrice: true,
          nomSnapshot: true,
          skuSnapshot: true,
          categorie: true,
        },
      },
    },
  });

  // Filtrage selon la vue
  const enAttente = pos.filter((p) => p.status === 'EN_ATTENTE');
  const partiels = pos.filter((p) => p.status === 'PARTIEL');
  const recus = pos.filter((p) => p.status === 'RECU' || p.status === 'ANNULE');

  const actifs = vueActuelle === 'commandes' ? enAttente : partiels;
  const archives = vueActuelle === 'commandes' ? [] : recus;

  return (
    <div>
      <PageHeader
        eyebrow="commandes fournisseurs"
        title={
          <>
            Pièces{' '}
            <span className="opacity-70" style={{ fontSize: '0.6em' }}>
              : {vueActuelle === 'commandes' ? 'commandes' : 'réception'}
            </span>
          </>
        }
        subline={`${pos.length} PO${pos.length === 1 ? '' : 's'} · ${actifs.length} ${vueActuelle === 'commandes' ? 'en attente' : 'à recevoir'}${trimmed ? ` · filtré sur « ${trimmed} »` : ''}`}
        actions={
          <ToolbarBlock>
            <SearchBar placeholder="N° PO, fournisseur, notes…" />
            <a href="/api/admin/export/pos" className="btn-secondary" style={{ height: '32px', padding: '0 14px', fontSize: '11px' }}>
              ↓ CSV
            </a>
            <Link
              href={`/${locale}/admin/pos/adhoc`}
              className="btn-secondary"
              style={{ height: '32px', padding: '0 14px', fontSize: '11px' }}
            >
              ADHOC
            </Link>
            <AddButton href={`/${locale}/admin/pos/new`} title="Nouveau PO" />
          </ToolbarBlock>
        }
      />

      <div className="bloc-contenu p-6">
        {/* Pills toggle 4 onglets V1 — partagés avec /admin/pieces */}
        <nav className="mb-4 inline-flex gap-1 rounded-full bg-[rgba(0,0,0,0.20)] p-1">
          {[
            { label: 'Catalogue',    href: `/${locale}/admin/pieces?onglet=catalogue`,    active: false },
            { label: 'Fournisseurs', href: `/${locale}/admin/pieces?onglet=fournisseurs`, active: false },
            { label: 'Commandes',    href: `/${locale}/admin/pos?vue=commandes`,          active: vueActuelle === 'commandes' },
            { label: 'Réception',    href: `/${locale}/admin/pos?vue=reception`,          active: vueActuelle === 'reception' },
          ].map((t) => (
            <Link
              key={t.label}
              href={t.href as never}
              className={`inline-flex h-8 items-center rounded-full px-4 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                t.active
                  ? 'bg-[var(--jaune)] text-black'
                  : 'text-white/70 hover:bg-white/10'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        {pos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--gris-bord)] p-8 text-center text-sm text-[var(--text-secondary-60)]">
            Aucun PO {trimmed ? `pour « ${trimmed} »` : ''}.
          </p>
        ) : (
          <>
            {actifs.length > 0 ? (
              <section className="mb-6">
                <h2 className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-secondary-60)]">
                  En cours <span className="ml-2 font-normal opacity-60">({actifs.length})</span>
                </h2>
                <div className="space-y-2">
                  {actifs.map((p) => <PoAccordion key={p.id} po={p} locale={locale} defaultOpen />)}
                </div>
              </section>
            ) : null}

            {archives.length > 0 ? (
              <section>
                <h2 className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-secondary-60)]">
                  Historique <span className="ml-2 font-normal opacity-60">({archives.length})</span>
                </h2>
                <div className="space-y-2">
                  {archives.map((p) => <PoAccordion key={p.id} po={p} locale={locale} />)}
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

type PoForAccordion = {
  id: string;
  poNumero: string;
  fournisseur: string;
  status: string;
  dateCommande: Date;
  dateReception: Date | null;
  items: Array<{
    id: string;
    qtyCommandee: import('@prisma/client').Prisma.Decimal;
    qtyRecue: import('@prisma/client').Prisma.Decimal;
    unitPrice: import('@prisma/client').Prisma.Decimal;
    nomSnapshot: string;
    skuSnapshot: string | null;
    categorie: string | null;
  }>;
};

function PoAccordion({
  po,
  locale,
  defaultOpen = false,
}: {
  po: PoForAccordion;
  locale: string;
  defaultOpen?: boolean;
}) {
  const sc = STATUS_INFO[po.status] ?? { bg: 'var(--gris-fond)', fg: '#000', label: po.status };
  const totalCmd = po.items.reduce((acc, i) => acc + Number(i.qtyCommandee), 0);
  const totalRecu = po.items.reduce((acc, i) => acc + Number(i.qtyRecue), 0);
  const valeur = po.items.reduce((acc, i) => acc + Number(i.qtyCommandee) * Number(i.unitPrice), 0);

  return (
    <details open={defaultOpen} className="overflow-hidden rounded-2xl shadow-sm">
      <summary
        className="flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-sm font-semibold"
        style={{ backgroundColor: sc.bg, color: sc.fg }}
      >
        <span className="flex flex-wrap items-baseline gap-3">
          <span className="font-mono">#{po.poNumero}</span>
          <span className="text-xs opacity-80">{po.fournisseur}</span>
          <span className="text-[10px] opacity-60">{po.dateCommande.toLocaleDateString('fr-CA')}</span>
          {po.dateReception ? (
            <span className="text-[10px] opacity-60">→ {po.dateReception.toLocaleDateString('fr-CA')}</span>
          ) : null}
        </span>
        <span className="flex items-center gap-3">
          <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-mono">
            {totalRecu}/{totalCmd}
          </span>
          <span className="font-mono text-xs tabular-nums">{valeur.toFixed(2)} $</span>
          <span className="rounded-full bg-black/20 px-2 py-0.5 text-[10px] uppercase tracking-wider">
            {sc.label}
          </span>
        </span>
      </summary>
      <div className="bg-white/85">
        {po.items.length === 0 ? (
          <p className="px-4 py-4 text-center text-xs italic text-[var(--text-secondary-60)]">
            Aucun item.
          </p>
        ) : (
          <table className="w-full text-xs">
            <thead className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
              <tr>
                <th className="px-3 py-1.5 text-left">Item</th>
                <th className="px-3 py-1.5 text-left">SKU</th>
                <th className="px-3 py-1.5 text-left">Catégorie</th>
                <th className="px-3 py-1.5 text-right">Cmd</th>
                <th className="px-3 py-1.5 text-right">Reçu</th>
                <th className="px-3 py-1.5 text-right">Restant</th>
                <th className="px-3 py-1.5 text-right">Prix</th>
                <th className="px-3 py-1.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {po.items.map((it) => {
                const qcm = Number(it.qtyCommandee);
                const qrc = Number(it.qtyRecue);
                const prix = Number(it.unitPrice);
                const restant = qcm - qrc;
                const recuComplet = restant <= 0 && qcm > 0;
                return (
                  <tr
                    key={it.id}
                    className="odd:bg-white/85 even:bg-white/70 border-t border-black/5"
                    style={recuComplet ? { backgroundColor: 'var(--st-approuve-bg)' } : undefined}
                  >
                    <td className="px-3 py-1.5">{it.nomSnapshot}</td>
                    <td className="px-3 py-1.5 font-mono text-[10px] text-[var(--text-secondary-60)]">{it.skuSnapshot ?? '—'}</td>
                    <td className="px-3 py-1.5 text-[var(--text-secondary-70)]">{it.categorie ?? '—'}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{qcm}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{qrc}</td>
                    <td className={`px-3 py-1.5 text-right tabular-nums ${restant > 0 ? 'font-semibold text-[var(--rouge)]' : 'text-[var(--text-secondary-60)]'}`}>{restant}</td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums">{prix.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums">{(qcm * prix).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <div className="flex items-center justify-end gap-2 border-t border-[var(--gris-bord)] px-4 py-2">
          <Link
            href={`/${locale}/admin/pos/${po.id}`}
            className="rounded-full bg-[var(--jaune)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-black hover:bg-[var(--jaune-h)]"
          >
            Ouvrir
          </Link>
        </div>
      </div>
    </details>
  );
}
