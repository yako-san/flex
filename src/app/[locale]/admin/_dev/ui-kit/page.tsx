'use client';

import { useState } from 'react';
import { ChevronDown, Plus, Search, Settings, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Pill } from '@/components/ui/pill';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const VELO_STATUSES = [
  'RV', 'REÇU', 'ÉVAL.', 'EN ATTENTE', 'APPROUVÉ', 'ON BENCH',
  'CTRL QLTÉ', 'FINI', 'FACTURER', 'FACTURÉ', 'LIVRÉ', 'REFUSÉ',
] as const;

const CMD_STATUSES = ['...', '—', '√', '$', '#', '@'] as const;
const ETAPES = ['eval', 'meca', 'ctrl'] as const;

export default function UIKitPage() {
  const [recherche, setRecherche] = useState('');

  return (
    <div className="space-y-12 p-6 max-w-6xl mx-auto" style={{ color: '#fff' }}>
      <header>
        <p className="text-white text-[13px] font-bold mb-1">infrastructure ui — sprint 4 phase 0</p>
        <h1
          style={{
            color: 'var(--jaune)',
            fontFamily: "'HelveticaNeue-Thin', 'Helvetica Neue Thin', 'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 300,
            fontSize: 'clamp(32px, 7vw, 50px)',
            lineHeight: 1,
          }}
        >
          UI Kit
        </h1>
        <p className="text-white/70 mt-2 text-sm">
          Page de QA Phase 0. Vérifie visuellement que les tokens V1 sont alignés.
        </p>
      </header>

      {/* ──────────── Boutons ──────────── */}
      <section className="space-y-4">
        <h2 className="text-white text-xl font-black uppercase tracking-wider">Boutons</h2>
        <div className="flex flex-wrap gap-3 items-center">
          <Button variant="primary">Sauvegarder</Button>
          <Button variant="secondary">Annuler</Button>
          <Button variant="danger">Supprimer</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Lien</Button>
          <Button variant="primary" disabled>Désactivé</Button>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <Button variant="primary" size="sm">Petit</Button>
          <Button variant="primary" size="default">Défaut</Button>
          <Button variant="primary" size="lg">Large</Button>
          <Button variant="primary" size="icon" aria-label="Ajouter">
            <Plus />
          </Button>
        </div>
      </section>

      {/* ──────────── Pills statuts vélo ──────────── */}
      <section className="space-y-4">
        <h2 className="text-white text-xl font-black uppercase tracking-wider">Pills — statuts vélo</h2>
        <div className="flex flex-wrap gap-2">
          {VELO_STATUSES.map((s) => (
            <Pill key={s} veloStatus={s} size="md" />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {VELO_STATUSES.slice(0, 6).map((s) => (
            <Pill key={s} veloStatus={s} size="lg" />
          ))}
        </div>
      </section>

      {/* ──────────── Pills statuts pièces (cmd) ──────────── */}
      <section className="space-y-4">
        <h2 className="text-white text-xl font-black uppercase tracking-wider">Pills — statuts pièces (cmd)</h2>
        <div className="flex flex-wrap gap-2 items-center">
          {CMD_STATUSES.map((c) => (
            <Pill key={c} cmdStatus={c} size="md" />
          ))}
          <span className="text-white/60 text-xs ml-2">
            (... listée, — estimée, √ à commander, $ en commande, # partielle, @ reçue)
          </span>
        </div>
      </section>

      {/* ──────────── Pills étapes mécaniciens ──────────── */}
      <section className="space-y-4">
        <h2 className="text-white text-xl font-black uppercase tracking-wider">Pills — étapes mécaniciens</h2>
        <div className="flex flex-wrap gap-2">
          {ETAPES.map((e) => (
            <Pill key={e} etape={e} size="md" />
          ))}
        </div>
      </section>

      {/* ──────────── Badges shadcn ──────────── */}
      <section className="space-y-4">
        <h2 className="text-white text-xl font-black uppercase tracking-wider">Badges</h2>
        <div className="flex flex-wrap gap-3">
          <Badge variant="default">Défaut</Badge>
          <Badge variant="secondary">Secondaire</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructif</Badge>
        </div>
      </section>

      {/* ──────────── Inputs ──────────── */}
      <section className="space-y-4">
        <h2 className="text-white text-xl font-black uppercase tracking-wider">Inputs</h2>
        <div className="bg-white/85 rounded-2xl p-6 max-w-md space-y-4">
          <div>
            <Label htmlFor="prenom">prénom</Label>
            <Input id="prenom" placeholder="Marie" />
          </div>
          <div>
            <Label htmlFor="email">courriel</Label>
            <Input id="email" type="email" placeholder="marie@example.ca" />
          </div>
          <div>
            <Label htmlFor="recherche">recherche live</Label>
            <Input
              id="recherche"
              type="search"
              placeholder="Tape pour tester le focus…"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
            {recherche && (
              <p className="text-black/60 text-xs mt-1">tu cherches : « {recherche} »</p>
            )}
          </div>
        </div>
      </section>

      {/* ──────────── Dialog ──────────── */}
      <section className="space-y-4">
        <h2 className="text-white text-xl font-black uppercase tracking-wider">Dialog</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="primary">Ouvrir un dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter des services</DialogTitle>
              <DialogDescription>
                Sélectionne les services à ajouter à ce BDT. Test pattern V1.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2 text-black/80">
              <p className="text-sm">Contenu du dialog. Le X en haut-droite ferme.</p>
              <ul className="list-disc list-inside text-sm text-black/60 space-y-1">
                <li>Coins arrondis 24px (rounded-3xl)</li>
                <li>Ombre prononcée (0 20px 60px rgba(0,0,0,0.35))</li>
                <li>Animations fade + zoom</li>
              </ul>
            </div>
            <DialogFooter>
              <Button variant="secondary">Annuler</Button>
              <Button variant="primary">Confirmer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>

      {/* ──────────── Icônes Lucide ──────────── */}
      <section className="space-y-4">
        <h2 className="text-white text-xl font-black uppercase tracking-wider">Icônes Lucide</h2>
        <div className="flex flex-wrap gap-6 items-center text-white">
          <div className="flex flex-col items-center gap-1">
            <Wrench className="size-8 text-[var(--jaune)]" />
            <span className="text-xs text-white/60">Wrench</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Settings className="size-8 text-[var(--jaune)]" />
            <span className="text-xs text-white/60">Settings</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Search className="size-8 text-[var(--jaune)]" />
            <span className="text-xs text-white/60">Search</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Plus className="size-8 text-[var(--jaune)]" />
            <span className="text-xs text-white/60">Plus</span>
          </div>
        </div>
      </section>

      {/* ──────────── DropdownMenu ──────────── */}
      <section className="space-y-4">
        <h2 className="text-white text-xl font-black uppercase tracking-wider">DropdownMenu</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary">
              Statut vélo <ChevronDown className="ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Changer le statut</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>RV</DropdownMenuItem>
            <DropdownMenuItem>ÉVAL.</DropdownMenuItem>
            <DropdownMenuItem>ON BENCH</DropdownMenuItem>
            <DropdownMenuItem>FACTURÉ</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </section>

      {/* ──────────── Select ──────────── */}
      <section className="space-y-4">
        <h2 className="text-white text-xl font-black uppercase tracking-wider">Select</h2>
        <div className="bg-white/85 rounded-2xl p-6 max-w-xs space-y-2">
          <Label htmlFor="mecano">mécano éval</Label>
          <Select>
            <SelectTrigger id="mecano">
              <SelectValue placeholder="Sélectionner…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yako">yako</SelectItem>
              <SelectItem value="jc">jc</SelectItem>
              <SelectItem value="marie">marie</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* ──────────── Popover + Tooltip ──────────── */}
      <section className="space-y-4">
        <h2 className="text-white text-xl font-black uppercase tracking-wider">Popover & Tooltip</h2>
        <div className="flex flex-wrap gap-3 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="secondary">Ouvrir popover</Button>
            </PopoverTrigger>
            <PopoverContent>
              <h3 className="font-bold mb-2 text-black">Avance versée</h3>
              <p className="text-sm text-black/70">
                Pattern PieceCmdEditor V1 — popup statut + note libre.
              </p>
            </PopoverContent>
          </Popover>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost">Hover-moi (tooltip)</Button>
              </TooltipTrigger>
              <TooltipContent>Tooltip texte court</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </section>

      {/* ──────────── Classes V1 directes (vérif globals.css) ──────────── */}
      <section className="space-y-4">
        <h2 className="text-white text-xl font-black uppercase tracking-wider">Classes V1 directes (globals.css)</h2>
        <div className="flex flex-wrap gap-3 items-center">
          <button type="button" className="btn-primary">btn-primary</button>
          <button type="button" className="btn-secondary">btn-secondary</button>
          <button type="button" className="btn-danger">btn-danger</button>
          <button type="button" className="btn-plus-round" aria-label="Ajouter">+</button>
        </div>
        <div className="bg-white/70 rounded-2xl p-4 max-w-md">
          <label className="label-system" htmlFor="v1-input">label-system v1</label>
          <input id="v1-input" type="text" className="input-system" placeholder="input-system V1" />
        </div>
      </section>
    </div>
  );
}
