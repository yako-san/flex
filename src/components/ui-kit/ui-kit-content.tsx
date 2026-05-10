import { Plus, QrCode, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddButton, UtilButton, IconButton } from '@/components/ui/icon-button';
import { Pill } from '@/components/ui/pill';
import { PageHeader } from '@/components/ui/page-header';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DataTable,
  DataTableHead,
  DataTableHeadCell,
  DataTableRow,
  DataTableCell,
  RowGroup,
} from '@/components/ui/data-table';
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
import { UiKitPillsToggle } from './pills-toggle-demo';
import { UiKitCheckboxes } from './checkbox-demo';
import { SidebarPreview } from './sidebar-preview';

const STATUTS_VELO = [
  'rv', 'recu', 'eval', 'attente', 'approuve', 'on-bench', 'ctrl-qlte', 'fini', 'facturer', 'facture', 'livre',
] as const;
const STATUTS_CMD = [
  'cmd-listee', 'cmd-estimee', 'cmd-a-cmder', 'cmd-en-cmde', 'cmd-recu-part', 'cmd-recue',
] as const;
const ETAPES = ['etape-eval', 'etape-meca', 'etape-ctrl'] as const;

type Props = {
  /** Sur-titre affiché dans le PageHeader (ex: "settings · ui kit"). */
  eyebrow?: string;
};

/**
 * Vitrine complète des composants UI Flex V2. Server Component pur — peut
 * être rendu sans auth ni DB. Réutilisé par /admin/settings/ui-kit (auth) et
 * /dev/ui-kit (public, debug Sprint 4).
 */
export function UiKitContent({ eyebrow = 'dev · qa visuelle' }: Props) {
  return (
    <div className="space-y-12 pb-24">
      <PageHeader
        eyebrow={eyebrow}
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

      <Section title="Boutons (V1 pill 30px radius, h4 uppercase 0.1em)">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Enregistrer</Button>
          <Button variant="secondary">Annuler</Button>
          <Button variant="danger">Supprimer</Button>
          <Button variant="dark">Émettre facture</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Voir détail</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex items-center gap-3 pt-3">
          <Button size="sm">SM 32px</Button>
          <Button size="md">MD 38px</Button>
          <Button size="lg">LG 44px</Button>
        </div>
      </Section>

      <Section title="IconButton (AddButton 40×40 jaune+shadow / UtilButton 32×32 gris)">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <AddButton aria-label="Ajouter"><Plus size={24} /></AddButton>
            <span className="text-xs text-[var(--text-secondary-50)]">add (jaune)</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <IconButton tone="addOutline" aria-label="Ajouter (outline)"><Plus size={24} /></IconButton>
            <span className="text-xs text-[var(--text-secondary-50)]">addOutline</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <UtilButton aria-label="Rechercher"><Search size={16} /></UtilButton>
            <span className="text-xs text-[var(--text-secondary-50)]">util (32×32)</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <UtilButton aria-label="Étiquettes"><QrCode size={16} /></UtilButton>
            <span className="text-xs text-[var(--text-secondary-50)]">util qr</span>
          </div>
        </div>
      </Section>

      <Section title="Inputs / Labels (V1 input-system + label-system)">
        <div className="grid max-w-xl grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="ui-prenom">Prénom</Label>
            <Input id="ui-prenom" placeholder="Jean" />
          </div>
          <div>
            <Label htmlFor="ui-tel">Téléphone</Label>
            <Input id="ui-tel" type="tel" placeholder="514 555-1234" />
          </div>
          <div>
            <Label htmlFor="ui-mail">Courriel</Label>
            <Input id="ui-mail" type="email" placeholder="jean@exemple.ca" />
          </div>
          <div>
            <Label htmlFor="ui-disabled">Champ désactivé</Label>
            <Input id="ui-disabled" disabled value="—" readOnly />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="ui-notes">Notes (textarea)</Label>
            <Textarea id="ui-notes" placeholder="Commentaire libre…" rows={3} />
          </div>
        </div>
      </Section>

      <Section title="Checkbox custom (20×20, transparent + border noir 50%)">
        <UiKitCheckboxes />
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
              Pattern V1 réutilisé pour modale d&apos;avance, ajout d&apos;items, archivage, etc.
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

      <Section title="Hiérarchie typo V1">
        <div className="space-y-2 rounded-xl border border-[var(--gris-bord)] bg-white p-6">
          <h1>H1 · 3rem · weight 400 · Helvetica</h1>
          <h2>H2 · 1.8rem · weight 900</h2>
          <h3>H3 · 1.3rem · weight 600 · pas uppercase</h3>
          <h4>H4 · 0.9rem · uppercase 0.1em · weight 900</h4>
          <h5>H5 · 0.65rem · weight 600</h5>
          <h6>H6 · 0.5rem · italic · weight 600</h6>
          <p className="text-base">Body — Helvetica Neue, lorem ipsum dolor sit amet.</p>
          <p className="text-gray-400">text-gray-400 → noir 50% (override Tailwind bleuté)</p>
          <p className="text-gray-500">text-gray-500 → noir 60%</p>
          <p className="text-gray-600">text-gray-600 → noir 70%</p>
          <p className="text-gray-700">text-gray-700 → noir 80%</p>
        </div>
      </Section>

      <Section title="Listes alternées V1 (.list-row-even / .list-row-odd / .list-row-highlight)">
        <DataTable>
          <DataTableHead>
            <tr>
              <DataTableHeadCell>Item</DataTableHeadCell>
              <DataTableHeadCell>Notes</DataTableHeadCell>
              <DataTableHeadCell align="right">Qté</DataTableHeadCell>
              <DataTableHeadCell align="right">Prix</DataTableHeadCell>
            </tr>
          </DataTableHead>
          <tbody>
            <DataTableRow zebra="even">
              <DataTableCell>Shimano Tourney TY21-GS</DataTableCell>
              <DataTableCell>—</DataTableCell>
              <DataTableCell align="right" mono>1</DataTableCell>
              <DataTableCell align="right" mono>12,00 $</DataTableCell>
            </DataTableRow>
            <DataTableRow zebra="odd">
              <DataTableCell>Jagwire Câbles freins Basics VTT</DataTableCell>
              <DataTableCell>OOS</DataTableCell>
              <DataTableCell align="right" mono>2</DataTableCell>
              <DataTableCell align="right" mono>38,00 $</DataTableCell>
            </DataTableRow>
            <DataTableRow zebra="even">
              <DataTableCell>Babac Boulons 45mm alliage</DataTableCell>
              <DataTableCell>—</DataTableCell>
              <DataTableCell align="right" mono>5</DataTableCell>
              <DataTableCell align="right" mono>8,75 $</DataTableCell>
            </DataTableRow>
            <DataTableRow zebra="highlight">
              <DataTableCell>Pièce mise en évidence</DataTableCell>
              <DataTableCell>highlight</DataTableCell>
              <DataTableCell align="right" mono>1</DataTableCell>
              <DataTableCell align="right" mono>—</DataTableCell>
            </DataTableRow>
          </tbody>
        </DataTable>
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
