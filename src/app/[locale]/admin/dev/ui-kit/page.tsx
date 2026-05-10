import { setRequestLocale } from 'next-intl/server';
import {
  Wrench,
  Cog,
  Clock,
  Banknote,
  PackageOpen,
  ClipboardList,
  LayoutDashboard,
  Users,
  Archive,
  Plus,
  QrCode,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddButton, UtilButton } from '@/components/ui/icon-button';
import { Pill } from '@/components/ui/pill';
import { PageHeader } from '@/components/ui/page-header';
import {
  DataTable,
  DataTableHead,
  DataTableHeadCell,
  DataTableRow,
  DataTableCell,
  RowGroup,
} from '@/components/ui/data-table';
import { Sidebar, type SidebarItem } from '@/components/ui/sidebar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { UiKitPillsToggle } from './_pills-toggle-demo';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

const sidebarItems: SidebarItem[] = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { href: '/admin/inventaire', icon: Wrench, label: 'Inventaire', badge: 7, badgeVariant: 'vert' },
  { href: '/admin/clients', icon: Users, label: 'Clients' },
  { href: '/admin/pieces', icon: Cog, label: 'Pièces', badge: 49, badgeVariant: 'rouge' },
  { href: '/admin/services', icon: Clock, label: 'Services' },
  { href: '/admin/ventes', icon: Banknote, label: 'Ventes', badge: 1, badgeVariant: 'rouge' },
  { href: '/admin/reception', icon: PackageOpen, label: 'Réception' },
  { href: '/admin/commandes', icon: ClipboardList, label: 'Commandes' },
  { href: '/admin/archives', icon: Archive, label: 'Archives' },
];

const STATUTS_VELO = [
  'rv', 'recu', 'eval', 'attente', 'approuve', 'on-bench', 'ctrl-qlte', 'fini', 'facturer', 'facture', 'livre',
] as const;
const STATUTS_CMD = [
  'cmd-listee', 'cmd-estimee', 'cmd-a-cmder', 'cmd-en-cmde', 'cmd-recu-part', 'cmd-recue',
] as const;
const ETAPES = ['etape-eval', 'etape-meca', 'etape-ctrl'] as const;

export default async function UiKitPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="space-y-12 pb-24">
      <PageHeader
        eyebrow="dev · qa visuelle"
        title="UI Kit"
        hint="composants Sprint 4"
        subline="Vitrine des primitives Flex V2 — palette V1, tokens CSS variables, multi-tenant ready."
        actions={
          <>
            <UtilButton aria-label="Rechercher"><Search size={16} /></UtilButton>
            <Button variant="outline" size="sm">↓ Export</Button>
            <AddButton aria-label="Ajouter"><Plus size={20} /></AddButton>
          </>
        }
      />

      <Section title="Tokens couleurs">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Swatch label="--jaune" varName="--jaune" />
          <Swatch label="--rouge" varName="--rouge" />
          <Swatch label="--gris-bg" varName="--gris-bg" />
          <Swatch label="--dark" varName="--dark" textLight />
        </div>
      </Section>

      <Section title="Boutons">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="jaune">Jaune signature</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex items-center gap-3 pt-3">
          <Button size="sm">SM</Button>
          <Button size="md">MD</Button>
          <Button size="lg">LG</Button>
        </div>
      </Section>

      <Section title="IconButton (AddButton 37×37 / UtilButton 32×32)">
        <div className="flex items-center gap-3">
          <AddButton aria-label="Ajouter"><Plus size={20} /></AddButton>
          <UtilButton aria-label="Rechercher"><Search size={16} /></UtilButton>
          <UtilButton aria-label="Étiquettes"><QrCode size={16} /></UtilButton>
        </div>
      </Section>

      <Section title="Pills — statuts vélo">
        <div className="flex flex-wrap gap-2">
          {STATUTS_VELO.map((v) => (
            <Pill key={v} variant={v}>{v}</Pill>
          ))}
        </div>
      </Section>

      <Section title="Pills — statuts pièces (cmd)">
        <div className="flex flex-wrap gap-2">
          {STATUTS_CMD.map((v) => (
            <Pill key={v} variant={v}>{v.replace('cmd-', '')}</Pill>
          ))}
        </div>
      </Section>

      <Section title="Pills — étapes mécaniciens">
        <div className="flex flex-wrap gap-2">
          {ETAPES.map((v) => (
            <Pill key={v} variant={v}>{v.replace('etape-', '')}</Pill>
          ))}
        </div>
      </Section>

      <Section title="PillsToggle (interactif)">
        <UiKitPillsToggle />
      </Section>

      <Section title="Dialog (Modal)">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="jaune">Ouvrir le modal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Avance client</DialogTitle>
              <DialogDescription>
                Saisis le montant, le mode de paiement et une note optionnelle.
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm text-[var(--text-secondary-70)]">
              Pattern V1 réutilisé pour modale d'avance, ajout d'items, archivage, etc.
            </p>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Annuler</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="jaune">Enregistrer</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Section>

      <Section title="DataTable + RowGroup (Inventaire mock)">
        <DataTable>
          <DataTableHead>
            <tr>
              <DataTableHeadCell>BDT</DataTableHeadCell>
              <DataTableHeadCell>Client</DataTableHeadCell>
              <DataTableHeadCell>Vélo</DataTableHeadCell>
              <DataTableHeadCell>Statut</DataTableHeadCell>
              <DataTableHeadCell align="right">Date in</DataTableHeadCell>
            </tr>
          </DataTableHead>
          <tbody>
            <RowGroup label="Nouveau" count={2} colSpan={5} />
            <DataTableRow>
              <DataTableCell mono>0144 <Pill variant="rv" size="sm">RV</Pill></DataTableCell>
              <DataTableCell>Etienne Mayrand</DataTableCell>
              <DataTableCell>—</DataTableCell>
              <DataTableCell><Pill variant="attente" size="sm">attente approbation</Pill></DataTableCell>
              <DataTableCell align="right">2026-05-08 12 h 30</DataTableCell>
            </DataTableRow>
            <DataTableRow>
              <DataTableCell mono>0145 <Pill variant="rv" size="sm">RV</Pill></DataTableCell>
              <DataTableCell>Julie St-Arnault</DataTableCell>
              <DataTableCell>—</DataTableCell>
              <DataTableCell><Pill variant="attente" size="sm">attente approbation</Pill></DataTableCell>
              <DataTableCell align="right">2026-05-11 08 h 30</DataTableCell>
            </DataTableRow>
            <RowGroup label="WIP" count={3} colSpan={5} />
            <DataTableRow>
              <DataTableCell mono>0119 <Pill variant="on-bench" size="sm">on bench</Pill></DataTableCell>
              <DataTableCell>Julie Verreau Howard</DataTableCell>
              <DataTableCell>Raleigh, Superbe, blanc, M</DataTableCell>
              <DataTableCell><Pill variant="approuve" size="sm">approuvé</Pill></DataTableCell>
              <DataTableCell align="right">2026-04-22</DataTableCell>
            </DataTableRow>
            <DataTableRow>
              <DataTableCell mono>0136 <Pill variant="approuve" size="sm">approuvé</Pill></DataTableCell>
              <DataTableCell>Walk-in</DataTableCell>
              <DataTableCell>Autre</DataTableCell>
              <DataTableCell><Pill variant="eval" size="sm">éval</Pill></DataTableCell>
              <DataTableCell align="right">2026-04-28</DataTableCell>
            </DataTableRow>
            <RowGroup label="Facturé" count={1} colSpan={5} />
            <DataTableRow>
              <DataTableCell mono>0123 <Pill variant="facture" size="sm">facturé</Pill></DataTableCell>
              <DataTableCell>Louise Bacher</DataTableCell>
              <DataTableCell>Bonelli, Lite 1, Vert emeraude, M</DataTableCell>
              <DataTableCell>—</DataTableCell>
              <DataTableCell align="right">2026-04-23</DataTableCell>
            </DataTableRow>
          </tbody>
        </DataTable>
      </Section>

      <Section title="Sidebar (preview encadré)">
        <div className="relative h-[520px] overflow-hidden rounded-xl border border-[var(--gris-bord)] bg-neutral-200">
          <div className="relative h-full">
            <div className="absolute inset-0 left-[var(--sidebar-w-collapsed)] overflow-auto bg-white p-6">
              <p className="text-sm text-[var(--text-secondary-60)]">
                Sidebar à gauche · hover pour expand · double-état collapsed/expanded.
              </p>
            </div>
            <SidebarPreview />
          </div>
        </div>
      </Section>

      <Section title="Notes implémentation">
        <ul className="list-inside list-disc space-y-1 text-sm text-[var(--text-secondary-70)]">
          <li>Tous les composants consomment des CSS variables — un Workshop.theme JSON peut surcharger sans rebuild.</li>
          <li>Radix UI primitives sous le capot (Dialog, etc.) — accessibilité ARIA + clavier garantie.</li>
          <li>CVA pour variants typés strict — autocomplete IDE complet sur Pill / Button.</li>
          <li>Lucide icons (mapping V1 Heroicons → Lucide documenté dans v1-v2-parity.md).</li>
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 px-6">
      <h2 className="text-base font-bold uppercase tracking-widest text-[var(--text-secondary-60)]">{title}</h2>
      {children}
    </section>
  );
}

function Swatch({ label, varName, textLight }: { label: string; varName: string; textLight?: boolean }) {
  return (
    <div
      className="flex h-20 items-end rounded-lg border border-[var(--gris-bord)] p-3 shadow-sm"
      style={{ background: `var(${varName})`, color: textLight ? 'white' : 'black' }}
    >
      <span className="font-mono text-xs">{label}</span>
    </div>
  );
}

function SidebarPreview() {
  return (
    <Sidebar
      items={sidebarItems}
      header={
        <div className="space-y-1">
          <div className="text-2xl font-bold tracking-tight">F/V</div>
          <div className="text-[10px] opacity-70">v2.0.0</div>
        </div>
      }
      footer={
        <div className="flex h-9 items-center justify-center rounded-full bg-black/15 text-xs font-bold">
          yk
        </div>
      }
    />
  );
}
