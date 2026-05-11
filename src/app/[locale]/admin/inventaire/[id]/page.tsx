import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { BDCHeader } from '@/components/domain/bdc-header';
import { BDCTotaux } from '@/components/domain/bdc-totaux';
import { Pill } from '@/components/ui/pill';
import { AddItemForm } from './add-item-form';
import { RemoveItemButton } from './remove-item-button';
import { TaskStatusButton } from './task-status-button';
import { WorkflowForm } from './workflow-form';
import { DeleteBdtButton } from './delete-button';
import { PdfButtons } from './pdf-buttons';
import { EmailButtons } from './email-buttons';
import { PieceCmdEditor } from './piece-cmd-editor';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

const KIND_VARIANT: Record<string, React.ComponentProps<typeof Pill>['variant']> = {
  SERVICE: 'on-bench',
  PIECE: 'facturer',
  FORFAIT: 'approuve',
};

export default async function BdtDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const workshop = await getActiveWorkshop();
  if (!workshop) return <p>Aucun workshop actif.</p>;

  const [bdc, services, pieces, forfaits, factureLog, equipeMembers] = await Promise.all([
    prisma.bdc.findFirst({
      where: { id, workshopId: workshop.id, deletedAt: null },
      include: {
        velo: {
          include: {
            client: true,
            marque: { select: { nom: true } },
          },
        },
        items: {
          orderBy: { position: 'asc' },
          include: {
            service: { select: { labelCanonical: true, legacyCode: true } },
            piece: { select: { nomCanonical: true, sku: true, legacyCode: true } },
            forfait: { select: { labelCanonical: true, legacyCode: true } },
            tasks: { orderBy: { position: 'asc' } },
          },
        },
      },
    }),
    prisma.service.findMany({
      where: { workshopId: workshop.id, deletedAt: null },
      orderBy: { labelCanonical: 'asc' },
      select: { id: true, labelCanonical: true, prix: true, legacyCode: true },
    }),
    prisma.piece.findMany({
      where: { workshopId: workshop.id, deletedAt: null },
      orderBy: { nomCanonical: 'asc' },
      select: { id: true, nomCanonical: true, sku: true, prixVente: true },
    }),
    prisma.forfait.findMany({
      where: { workshopId: workshop.id, deletedAt: null },
      orderBy: { labelCanonical: 'asc' },
      select: { id: true, labelCanonical: true, prix: true, legacyCode: true },
    }),
    prisma.factureLog.findFirst({
      where: { bdcId: id, workshopId: workshop.id },
      orderBy: { date: 'desc' },
      select: { id: true, factureNumero: true },
    }),
    prisma.equipeMember.findMany({
      where: { workshopId: workshop.id, deletedAt: null, active: true },
      orderBy: { nom: 'asc' },
      select: { id: true, surnom: true },
    }),
  ]);

  if (!bdc) notFound();

  const v1 = bdc.legacyRawV1 as Record<string, unknown> | null;
  const totalServices = Number(bdc.totalServices);
  const totalPieces = Number(bdc.totalPieces);
  const grandTotal = totalServices + totalPieces;
  const avanceMontant = bdc.avanceMontant != null ? Number(bdc.avanceMontant) : null;

  const serviceOptions = services.map((s) => ({
    id: s.id,
    label: `${s.legacyCode ?? '—'} · ${s.labelCanonical} · ${Number(s.prix).toFixed(2)}$`,
  }));
  const pieceOptions = pieces.map((p) => ({
    id: p.id,
    label: `${p.sku ?? '—'} · ${p.nomCanonical} · ${Number(p.prixVente).toFixed(2)}$`,
  }));
  const forfaitOptions = forfaits.map((f) => ({
    id: f.id,
    label: `${f.legacyCode ?? '—'} · ${f.labelCanonical} · ${Number(f.prix).toFixed(2)}$`,
  }));

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <Link
        href={`/${locale}/admin/inventaire`}
        className="inline-block text-sm text-[var(--text-secondary-60)] no-underline hover:text-[var(--dark)]"
      >
        ← Inventaire
      </Link>

      <BDCHeader
        locale={locale}
        bdcNumero={bdc.numero}
        veloNumero={bdc.velo.veloNumero}
        client={
          bdc.velo.client
            ? { id: bdc.velo.client.id, prenom: bdc.velo.client.prenom, nom: bdc.velo.client.nom }
            : null
        }
        velo={{
          marque: bdc.velo.marque?.nom ?? null,
          modele: bdc.velo.modele,
          couleur: bdc.velo.couleur,
        }}
        evalStatus={bdc.evalStatus}
        archiveStatus={bdc.archiveStatus}
        mecanos={equipeMembers.map((m) => ({ id: m.id, nom: m.surnom }))}
        evalMecanoId={bdc.velo.evalMecanoId}
        mecaMecanoId={bdc.velo.mecaMecanoId}
        ctrlMecanoId={bdc.velo.ctrlMecanoId}
        cbEvalEnvoye={bdc.cbEvalEnvoye}
        cbEval={bdc.cbEval}
        cbBonSortie={bdc.cbBonSortie}
        cbArchiver={bdc.cbArchiver}
        actions={<DeleteBdtButton bdcId={bdc.id} />}
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Colonne gauche : items */}
        <div className="flex flex-col gap-4">
          <section>
            <h2 className="mb-3 text-base font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
              Items ({bdc.items.length})
            </h2>

            <AddItemForm
              bdcId={bdc.id}
              services={serviceOptions}
              pieces={pieceOptions}
              forfaits={forfaitOptions}
            />

            {bdc.items.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary-60)]">
                Aucun item. Utilise le formulaire ci-dessus.
              </p>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--gris-bord)] bg-[var(--gris-fond)]">
                    <th className="px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
                      #
                    </th>
                    <th className="px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
                      Type
                    </th>
                    <th className="px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
                      Description
                    </th>
                    <th className="px-2 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
                      Qté
                    </th>
                    <th className="px-2 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
                      P.U.
                    </th>
                    <th className="px-2 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
                      Total
                    </th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {bdc.items.flatMap((item) => {
                    const rows: React.ReactNode[] = [
                      <tr key={item.id} className="border-b border-[var(--gris-fond)]">
                        <td className="px-2 py-2 font-mono text-xs text-[var(--text-secondary-60)]">
                          {item.position}
                        </td>
                        <td className="px-2 py-2">
                          <Pill variant={KIND_VARIANT[item.kind] ?? 'neutral'} size="sm">
                            {item.kind.toLowerCase()}
                          </Pill>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span>{item.labelSnapshot}</span>
                            {item.kind === 'PIECE' ? (
                              <PieceCmdEditor
                                itemId={item.id}
                                cmdStatus={item.cmdStatus}
                                cmdNote={item.cmdNote}
                              />
                            ) : null}
                          </div>
                          {item.piece?.sku ? (
                            <div className="font-mono text-[11px] text-[var(--text-secondary-60)]">
                              SKU {item.piece.sku}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-2 py-2 text-right font-mono tabular-nums">
                          {Number(item.qty)}
                        </td>
                        <td className="px-2 py-2 text-right font-mono tabular-nums">
                          {Number(item.unitPriceSnapshot).toFixed(2)}
                        </td>
                        <td className="px-2 py-2 text-right font-mono tabular-nums">
                          {Number(item.total).toFixed(2)}
                        </td>
                        <td className="px-2 py-2 text-right">
                          <RemoveItemButton itemId={item.id} />
                        </td>
                      </tr>,
                    ];
                    if (item.tasks.length > 0) {
                      rows.push(
                        <tr key={`${item.id}-tasks`}>
                          <td colSpan={7} className="bg-[var(--gris-fond)] px-12 py-2">
                            <div className="mb-1 text-[10px] uppercase tracking-wider text-[var(--text-secondary-60)]">
                              Sous-tâches du forfait ({item.tasks.length}) — clique pour cycler
                            </div>
                            <ul className="m-0 list-none p-0 text-sm">
                              {item.tasks.map((t) => (
                                <li key={t.id} className="flex items-center gap-2 py-0.5">
                                  <TaskStatusButton taskId={t.id} status={t.status} />
                                  <span>{t.labelSnapshot}</span>
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>,
                      );
                    }
                    return rows;
                  })}
                </tbody>
              </table>
            )}
          </section>

          {v1 ? (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-[var(--text-secondary-60)]">
                Données v1 brutes
              </summary>
              <pre className="mt-2 overflow-auto rounded-lg bg-[var(--gris-fond)] p-4 text-xs">
                {JSON.stringify(v1, null, 2)}
              </pre>
            </details>
          ) : null}
        </div>

        {/* Colonne droite : totaux + documents + workflow */}
        <div className="flex flex-col gap-4">
          <BDCTotaux
            sousTotalServices={totalServices}
            sousTotalPieces={totalPieces}
            tps={0}
            tvq={0}
            grandTotal={grandTotal}
            avance={
              avanceMontant != null
                ? {
                    montant: avanceMontant,
                    mode: bdc.avanceMode ?? 'INTERAC',
                    note: bdc.avanceNote ?? null,
                  }
                : null
            }
          />

          <section className="rounded-xl border border-[var(--gris-bord)] bg-white p-4">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
              Documents
            </h2>
            <PdfButtons
              bdcId={bdc.id}
              existingFactureLogId={factureLog?.id ?? null}
              existingFactureNumero={factureLog?.factureNumero ?? null}
            />
            <EmailButtons
              bdcId={bdc.id}
              clientCourriel={bdc.velo.client?.courriel ?? null}
              evalEnvoyee={bdc.cbEvalEnvoye}
              suiviEnvoye={bdc.cbSuiviEnvoye}
              factureLogId={factureLog?.id ?? null}
              factureNumero={factureLog?.factureNumero ?? null}
              gmailConnected={!!workshop.googleRefreshToken}
              gmailEmail={workshop.googleEmail}
            />
          </section>

          <section className="rounded-xl border border-[var(--gris-bord)] bg-white p-4">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
              Workflow
            </h2>
            <WorkflowForm bdc={bdc} key={bdc.updatedAt.toISOString()} />
          </section>
        </div>
      </div>
    </div>
  );
}
