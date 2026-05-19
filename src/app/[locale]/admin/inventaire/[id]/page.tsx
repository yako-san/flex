import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PlusIcon, WrenchIcon, CogIcon } from '@/components/icons';
import type { BdcPieceCmdStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getActiveWorkshop } from '@/lib/workshop';
import { BdtSidecard } from '@/components/domain/bdt-sidecard';
import { BDCTotaux } from '@/components/domain/bdc-totaux';
import { PageHeader } from '@/components/ui/page-header';
import { Pill } from '@/components/ui/pill';
import { VELO_STATUS_COLORS } from '@/lib/velo/status-labels';
import { AddItemForm } from './add-item-form';
import { RemoveItemButton } from './remove-item-button';
import { TaskStatusButton } from './task-status-button';
import { AvanceFragment, NotesFragment, RemisesFragment } from './workflow-fragments';
import { NoteInterneFragment } from './note-interne-fragment';
import { DeleteBdtButton } from './delete-button';
import { ArchiveBdtButton } from './archive-button';
import { PdfButtons } from './pdf-buttons';
import { EmailButtons } from './email-buttons';
import { BdcPhotoGallery } from './photo-gallery';
import { BdcPhotoUpload } from './photo-upload';
import { PieceCmdEditor } from './piece-cmd-editor';
import { BdtAdvancement } from './bdt-advancement';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type Props = {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ vue?: 'client' | 'velo' }>;
};

export default async function BdtDetailPage({ params, searchParams }: Props) {
  const { locale, id } = await params;
  const { vue } = await searchParams;
  setRequestLocale(locale);

  const workshop = await getActiveWorkshop();
  if (!workshop) return <p>Aucun workshop actif.</p>;

  const [bdc, services, pieces, forfaits, factureLog, photos, equipeMembers] = await Promise.all([
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
    prisma.bdcPhoto.findMany({
      where: { bdcId: id, workshopId: workshop.id, deletedAt: null },
      orderBy: { position: 'asc' },
      select: { id: true, blobUrl: true, caption: true, kind: true, position: true },
    }),
    prisma.equipeMember.findMany({
      where: { workshopId: workshop.id, deletedAt: null, active: true },
      orderBy: { nom: 'asc' },
      select: { id: true, surnom: true },
    }),
  ]);

  if (!bdc) notFound();

  const veloStatus = bdc.velo.status;
  const blockBg = VELO_STATUS_COLORS[veloStatus].bg;
  const totalServices = Number(bdc.totalServices);
  const totalPieces = Number(bdc.totalPieces);
  const grandTotal = totalServices + totalPieces;
  const avanceMontant = bdc.avanceMontant != null ? Number(bdc.avanceMontant) : null;

  const findMecano = (id: string | null) =>
    id ? equipeMembers.find((m) => m.id === id) ?? null : null;
  const evalMec = findMecano(bdc.velo.evalMecanoId);
  const mecaMec = findMecano(bdc.velo.mecaMecanoId);
  const ctrlMec = findMecano(bdc.velo.ctrlMecanoId);

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

  const itemsServices = bdc.items.filter((i) => i.kind === 'SERVICE' || i.kind === 'FORFAIT');
  const itemsPieces = bdc.items.filter((i) => i.kind === 'PIECE');

  const baseUrl = `/${locale}/admin/inventaire/${bdc.id}`;
  const section = vue === 'velo' ? 'velo' : 'client';

  const veloLine = [bdc.velo.marque?.nom, bdc.velo.modele].filter(Boolean).join(' ');

  return (
    <div>
      <PageHeader
        eyebrow="vélos en atelier"
        title={
          <>
            Bon de travail{' '}
            <span className="font-mono font-bold">
              #{String(bdc.numero).padStart(4, '0')}
            </span>
          </>
        }
        subline={
          <Link
            href={`/${locale}/admin/bdcs`}
            className="hover:underline"
          >
            ← Inventaire {veloLine ? `· ${veloLine}` : ''}
          </Link>
        }
        actions={
          <div className="flex items-center gap-2">
            <ArchiveBdtButton bdcId={bdc.id} resteAPayer={Math.max(0, grandTotal - (avanceMontant ?? 0))} />
            <DeleteBdtButton bdcId={bdc.id} />
          </div>
        }
      />

      <div className="bloc-contenu mx-auto flex max-w-[1400px] flex-col gap-4 p-4">
      {/* 3 colonnes principales : carte gauche unifiée + Services + Pièces */}
      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)_minmax(0,1fr)]">
        <BdtSidecard
          locale={locale}
          bdcNumero={bdc.numero}
          veloNumero={bdc.velo.veloNumero}
          veloStatus={veloStatus}
          velo={{
            marque: bdc.velo.marque?.nom ?? null,
            modele: bdc.velo.modele,
            couleur: bdc.velo.couleur,
            taille: bdc.velo.taille,
            numeroSerie: bdc.velo.numeroSerie,
          }}
          client={
            bdc.velo.client
              ? { id: bdc.velo.client.id, prenom: bdc.velo.client.prenom, nom: bdc.velo.client.nom }
              : null
          }
          dateIn={bdc.velo.date1}
          dateOut={bdc.velo.date3}
          evalMecano={evalMec ? { id: evalMec.id, nom: evalMec.surnom } : null}
          mecaMecano={mecaMec ? { id: mecaMec.id, nom: mecaMec.surnom } : null}
          ctrlMecano={ctrlMec ? { id: ctrlMec.id, nom: ctrlMec.surnom } : null}
          workflow={{
            cbEvalEnvoye: bdc.cbEvalEnvoye,
            cbEval: bdc.cbEval,
            cbBonSortie: bdc.cbBonSortie,
            cbArchiver: bdc.cbArchiver,
          }}
          advancementSlot={
            <BdtAdvancement
              bdcId={bdc.id}
              initialCheckboxes={{
                cbEvalEnvoye: bdc.cbEvalEnvoye,
                cbEval: bdc.cbEval,
                cbBonSortie: bdc.cbBonSortie,
                cbArchiver: bdc.cbArchiver,
              }}
              initialEvalStatus={bdc.evalStatus}
            />
          }
          section={section}
          sectionToggleUrl={{
            client: `${baseUrl}?vue=client`,
            velo: `${baseUrl}?vue=velo`,
          }}
          noteInterneSlot={
            <NoteInterneFragment
              bdcId={bdc.id}
              initialNotes={bdc.notes ?? ''}
              noteClientEval={bdc.noteClientEval ?? ''}
              noteClientFacture={bdc.noteClientFacture ?? ''}
              key={`note-interne-${bdc.updatedAt.toISOString()}`}
            />
          }
        />

        {/* COLONNE CENTRE — Services + Forfaits */}
        <ItemsBlock
          icon={<WrenchIcon width={16} height={16} />}
          title="Services"
          count={itemsServices.length}
          accentBg={blockBg}
          total={totalServices}
          remiseHint={
            bdc.remiseSvcValue
              ? `Remise ${Number(bdc.remiseSvcValue)}${bdc.remiseSvcType === 'PCT' ? ' %' : ' $'}`
              : null
          }
          addForm={
            <AddItemForm
              bdcId={bdc.id}
              services={serviceOptions}
              pieces={[]}
              forfaits={forfaitOptions}
            />
          }
        >
          {itemsServices.length === 0 ? (
            <EmptyRow label="Aucun service" />
          ) : (
            <ItemsTable
              items={itemsServices.map((item) => ({
                id: item.id,
                position: item.position,
                kind: item.kind,
                label: item.labelSnapshot,
                qty: Number(item.qty),
                unit: Number(item.unitPriceSnapshot),
                total: Number(item.total),
                cmdStatus: item.cmdStatus,
                cmdNote: item.cmdNote,
                sku: item.piece?.sku ?? null,
                tasks: item.tasks,
              }))}
              variant="services"
            />
          )}
        </ItemsBlock>

        {/* COLONNE DROITE — Pièces */}
        <ItemsBlock
          icon={<CogIcon width={16} height={16} />}
          title="Pièces"
          count={itemsPieces.length}
          accentBg={blockBg}
          total={totalPieces}
          remiseHint={
            bdc.remisePceValue
              ? `Remise ${Number(bdc.remisePceValue)}${bdc.remisePceType === 'PCT' ? ' %' : ' $'}`
              : null
          }
          addForm={
            <AddItemForm
              bdcId={bdc.id}
              services={[]}
              pieces={pieceOptions}
              forfaits={[]}
            />
          }
        >
          {itemsPieces.length === 0 ? (
            <EmptyRow label="Aucune pièce" />
          ) : (
            <ItemsTable
              items={itemsPieces.map((item) => ({
                id: item.id,
                position: item.position,
                kind: item.kind,
                label: item.labelSnapshot,
                qty: Number(item.qty),
                unit: Number(item.unitPriceSnapshot),
                total: Number(item.total),
                cmdStatus: item.cmdStatus,
                cmdNote: item.cmdNote,
                sku: item.piece?.sku ?? null,
                tasks: item.tasks,
              }))}
              variant="pieces"
            />
          )}
        </ItemsBlock>
      </div>

      {/* Bas : sous centre+droite uniquement (la carte gauche continue, c'est OK) */}
      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)_minmax(0,1fr)]">
        <div />
        <section className="rounded-2xl bg-white/85 p-4 shadow-sm lg:col-span-1">
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
              Note pour le client
            </h2>
            <Pill variant="eval" size="sm">Éval</Pill>
            <Pill variant="facture" size="sm">Facture</Pill>
          </div>
          <p className="text-xs text-[var(--text-secondary-60)]">
            {bdc.noteClientEval || bdc.noteClientFacture ? (
              <span className="whitespace-pre-wrap">
                {[bdc.noteClientEval, bdc.noteClientFacture].filter(Boolean).join('\n— Facture —\n')}
              </span>
            ) : (
              <span className="italic opacity-60">Message visible par le client sur l'évaluation et la facture.</span>
            )}
          </p>
        </section>
        <div className="lg:col-span-1">
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
        </div>
      </div>

      {/* Workflow & remises avancées (collapsible) */}
      {/* Fragments autosave Sprint 4 polish — chaque section a son propre
          patch ciblé + son indicateur de status. */}
      <details className="mt-2" open>
        <summary className="cursor-pointer text-sm font-semibold text-[var(--dark)] py-2">
          Remises, avance et notes
        </summary>
        <div className="mt-3 space-y-3">
          <RemisesFragment bdc={bdc} key={`remises-${bdc.updatedAt.toISOString()}`} />
          <AvanceFragment bdc={bdc} key={`avance-${bdc.updatedAt.toISOString()}`} />
          <NotesFragment bdc={bdc} key={`notes-${bdc.updatedAt.toISOString()}`} />
        </div>
      </details>

      {/* Documents & emails */}
      <section className="rounded-2xl bg-white/85 p-4 shadow-sm">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
          Documents & courriels
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

      {/* Section photos BDT (Sprint 2.8) */}
      <section className="rounded-2xl bg-white/85 p-4 shadow-sm">
        <header className="mb-3 flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
            Photos
          </h2>
          <span className="rounded-full bg-[var(--gris-fond)] px-2 py-0.5 text-[10px] font-mono text-[var(--text-secondary-60)]">
            {photos.length}
          </span>
        </header>
        <BdcPhotoGallery photos={photos} />
        <div className="mt-3">
          <BdcPhotoUpload bdcId={bdc.id} />
        </div>
      </section>
      </div>
    </div>
  );
}

// ── Composants internes pour les blocs Services/Pièces ─────────────

type ItemRow = {
  id: string;
  position: number;
  kind: 'SERVICE' | 'PIECE' | 'FORFAIT';
  label: string;
  qty: number;
  unit: number;
  total: number;
  cmdStatus: BdcPieceCmdStatus | null;
  cmdNote: string | null;
  sku: string | null;
  tasks: Array<{ id: string; status: string; labelSnapshot: string; position: number }>;
};

function ItemsBlock({
  icon,
  title,
  count,
  accentBg,
  total,
  remiseHint,
  addForm,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  accentBg: string;
  total: number;
  remiseHint: string | null;
  addForm: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl shadow-sm">
      <header
        className="flex items-center justify-between px-4 py-2 text-sm font-semibold"
        style={{ backgroundColor: accentBg, color: '#000' }}
      >
        <div className="flex items-center gap-2">
          <span aria-hidden>{icon}</span>
          <span>{title}</span>
          <span className="text-xs opacity-60">{count}</span>
        </div>
        <details className="relative">
          <summary className="inline-flex h-7 w-7 cursor-pointer list-none items-center justify-center rounded-full bg-white/40 hover:bg-white/60">
            <PlusIcon width={16} height={16} />
          </summary>
          <div className="absolute right-0 z-20 mt-2 min-w-[280px] rounded-xl bg-white p-3 shadow-lg ring-1 ring-black/10">
            {addForm}
          </div>
        </details>
      </header>

      <div className="bg-white/85">{children}</div>

      <footer
        className="flex items-center justify-between gap-3 px-4 py-2 text-xs"
        style={{ backgroundColor: accentBg, color: '#000' }}
      >
        <span className="opacity-70">{remiseHint ?? 'Aucune remise'}</span>
        <span className="font-mono text-sm font-semibold tabular-nums">
          total {total.toFixed(2)} $
        </span>
      </footer>
    </section>
  );
}

function EmptyRow({ label }: { label: string }) {
  return (
    <p className="px-4 py-6 text-center text-xs italic text-[var(--text-secondary-60)]">{label}</p>
  );
}

function ItemsTable({ items, variant }: { items: ItemRow[]; variant: 'services' | 'pieces' }) {
  return (
    <table className="w-full text-xs">
      <thead className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
        <tr>
          <th className="px-2 py-1.5 text-left">item</th>
          <th className="px-2 py-1.5 text-right">qté</th>
          <th className="px-2 py-1.5 text-right">prix</th>
          <th className="px-2 py-1.5 text-right">total</th>
          <th className="w-7" />
        </tr>
      </thead>
      <tbody>
        {items.flatMap((item) => {
          const rows: React.ReactNode[] = [
            <tr key={item.id} className="border-t border-black/5">
              <td className="px-2 py-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span>{item.label}</span>
                  {variant === 'pieces' ? (
                    <PieceCmdEditor
                      itemId={item.id}
                      cmdStatus={item.cmdStatus}
                      cmdNote={item.cmdNote}
                    />
                  ) : null}
                </div>
                {item.sku ? (
                  <div className="font-mono text-[10px] text-[var(--text-secondary-60)]">SKU {item.sku}</div>
                ) : null}
              </td>
              <td className="px-2 py-1.5 text-right font-mono tabular-nums">{item.qty}</td>
              <td className="px-2 py-1.5 text-right font-mono tabular-nums">{item.unit.toFixed(2)}</td>
              <td className="px-2 py-1.5 text-right font-mono tabular-nums">{item.total.toFixed(2)}</td>
              <td className="px-2 py-1.5 text-right">
                <RemoveItemButton itemId={item.id} />
              </td>
            </tr>,
          ];
          if (item.tasks.length > 0) {
            rows.push(
              <tr key={`${item.id}-tasks`} className="border-t border-black/5 bg-black/[0.02]">
                <td colSpan={5} className="px-6 py-1.5">
                  <ul className="space-y-0.5">
                    {item.tasks.map((t) => (
                      <li key={t.id} className="flex items-center gap-2 text-[11px]">
                        <TaskStatusButton taskId={t.id} status={t.status as never} />
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
  );
}
