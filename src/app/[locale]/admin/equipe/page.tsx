import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { PageHeader } from '@/components/ui/page-header';
import { Pill } from '@/components/ui/pill';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export default async function EquipePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const workshop = await getActiveWorkshop();
  if (!workshop) return <p className="p-6 text-[var(--text-secondary-60)]">Aucun workshop actif.</p>;

  const equipe = await prisma.equipeMember.findMany({
    where: { workshopId: workshop.id },
    orderBy: [{ active: 'desc' }, { surnom: 'asc' }],
  });

  const actifs = equipe.filter((m) => m.active).length;

  return (
    <div>
      <PageHeader
        eyebrow="paramètres · équipe"
        title="Équipe atelier"
        subline={`${actifs} actif${actifs === 1 ? '' : 's'} · ${equipe.length - actifs} inactif${equipe.length - actifs <= 1 ? '' : 's'}`}
        actions={
          <Link
            href={`/${locale}/admin/equipe/new`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--jaune)] text-black shadow-sm transition-colors hover:bg-[var(--jaune-h)]"
            aria-label="Nouveau membre"
            title="Nouveau membre"
          >
            <Plus size={20} />
          </Link>
        }
      />

      <div className="p-6">
        {equipe.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--gris-bord)] p-8 text-center text-sm text-[var(--text-secondary-60)]">
            Aucun membre d&apos;équipe. Ajoute-en un avec le bouton + en haut à droite.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-white/85 shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--gris-bord)] bg-white/50 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
                <tr>
                  <th className="px-3 py-2 text-left">Surnom</th>
                  <th className="px-3 py-2 text-left">Nom complet</th>
                  <th className="px-3 py-2 text-left">Rôle</th>
                  <th className="px-3 py-2 text-left">Courriel</th>
                  <th className="px-3 py-2 text-left">Téléphone</th>
                  <th className="px-3 py-2 text-left">Statut</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {equipe.map((m) => (
                  <tr
                    key={m.id}
                    className={`border-t border-[var(--gris-bord)]/30 hover:bg-[var(--gris-fond)] ${m.active ? '' : 'opacity-50'}`}
                  >
                    <td className="px-3 py-2 font-semibold">{m.surnom}</td>
                    <td className="px-3 py-2">{m.prenom} {m.nom}</td>
                    <td className="px-3 py-2 text-[var(--text-secondary-70)]">{m.role ?? '—'}</td>
                    <td className="px-3 py-2 text-xs">{m.courriel ?? '—'}</td>
                    <td className="px-3 py-2 tabular-nums text-xs">
                      {m.telephone ? `${m.indicatif ?? ''} ${m.telephone}` : '—'}
                    </td>
                    <td className="px-3 py-2">
                      {m.active ? (
                        <Pill variant="approuve" size="sm">Actif</Pill>
                      ) : (
                        <Pill variant="livre" size="sm">Inactif</Pill>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href={`/${locale}/admin/equipe/${m.id}/edit`}
                        className="text-xs text-[var(--jaune-h)] hover:underline"
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
