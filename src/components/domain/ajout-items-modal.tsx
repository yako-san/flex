'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PillsToggle } from '@/components/ui/pills-toggle';

export type ItemKind = 'SERVICE' | 'PIECE';

export type SelectableItem = {
  id: string;
  label: string;
  /** Sous-catégorie (ex: « Direction, Potence ») — utilisée pour grouper. */
  groupe?: string | null;
  /** Catégorie haut niveau (filtre dropdown). */
  categorie?: string | null;
  /** Prix unitaire affiché (snapshot). */
  prixUnit?: number | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Items disponibles à ajouter. Filtrés par `kind` côté parent OU ici. */
  services: SelectableItem[];
  pieces: SelectableItem[];
  /** Catégories (haut niveau) disponibles dans le filtre dropdown. */
  categories?: string[];
  /** Callback quand l'utilisateur valide la sélection. */
  onConfirm: (selection: { kind: ItemKind; ids: string[] }) => void;
  /** Catégorie pré-sélectionnée (optionnel). */
  initialKind?: ItemKind;
  initialCategorie?: string | null;
};

/**
 * Modal V1 d'ajout d'items (Services + Pièces) à un BDT.
 *
 * Pattern (cf. v1-ui-bundle.md) :
 *   - Toggle SERVICES / PIÈCES en haut.
 *   - Filtre catégorie (dropdown) + recherche libre.
 *   - Liste cochable groupée par sous-catégorie (`groupe`).
 *   - Bouton « Ajouter au BDT » applique la sélection multiple.
 *
 * État interne : `kind`, `categorieFilter`, `query`, `checked: Set<string>`.
 * Le parent applique les changements via `onConfirm` (server action).
 */
export function AjoutItemsModal({
  open,
  onOpenChange,
  services,
  pieces,
  categories,
  onConfirm,
  initialKind = 'SERVICE',
  initialCategorie = null,
}: Props) {
  const [kind, setKind] = React.useState<ItemKind>(initialKind);
  const [categorieFilter, setCategorieFilter] = React.useState<string | null>(initialCategorie);
  const [query, setQuery] = React.useState('');
  const [checked, setChecked] = React.useState<Set<string>>(new Set());

  // Reset à l'ouverture
  React.useEffect(() => {
    if (open) {
      setKind(initialKind);
      setCategorieFilter(initialCategorie);
      setQuery('');
      setChecked(new Set());
    }
  }, [open, initialKind, initialCategorie]);

  const items = kind === 'SERVICE' ? services : pieces;
  const norm = (s: string) => s.toLowerCase().trim();
  const q = norm(query);

  const filtered = items.filter((it) => {
    if (categorieFilter && it.categorie !== categorieFilter) return false;
    if (q) {
      const hay = `${it.label} ${it.groupe ?? ''} ${it.categorie ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  // Group by `groupe` (sous-catégorie)
  const grouped: Map<string, SelectableItem[]> = new Map();
  for (const it of filtered) {
    const key = it.groupe ?? '—';
    const arr = grouped.get(key) ?? [];
    arr.push(it);
    grouped.set(key, arr);
  }

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajouter au BDT</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3">
          <PillsToggle
            aria-label="Type d'item"
            options={[
              { value: 'SERVICE', label: 'Services' },
              { value: 'PIECE', label: 'Pièces' },
            ]}
            value={kind}
            onChange={setKind}
            size="sm"
          />
          <span className="text-xs text-[var(--text-secondary-60)]">
            {checked.size} sélectionné{checked.size > 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary-50)]"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un item…"
              className="pl-9"
              aria-label="Rechercher"
            />
          </div>
          {categories && categories.length > 0 ? (
            <select
              value={categorieFilter ?? ''}
              onChange={(e) => setCategorieFilter(e.target.value || null)}
              className={cn(
                'rounded-[var(--input-radius)] border-[1.5px] border-[var(--input-border)] bg-white px-3 py-2 text-sm',
                'md:text-sm focus:border-[var(--jaune)] focus:shadow-[0_0_0_3px_var(--input-focus-ring)] outline-none',
              )}
              aria-label="Filtrer par catégorie"
            >
              <option value="">Toutes catégories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        <div className="max-h-[420px] overflow-y-auto rounded-lg border border-[var(--gris-bord)] bg-white">
          {grouped.size === 0 ? (
            <p className="p-4 text-center text-sm text-[var(--text-secondary-60)]">
              Aucun résultat.
            </p>
          ) : (
            Array.from(grouped.entries()).map(([groupe, list]) => (
              <div key={groupe}>
                <div className="sticky top-0 bg-[var(--gris-fond)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary-60)]">
                  {groupe}
                </div>
                {list.map((it, idx) => {
                  const isChecked = checked.has(it.id);
                  return (
                    <label
                      key={it.id}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors hover:bg-[var(--overlay-light-50)]',
                        idx % 2 === 0 ? 'list-row-even' : 'list-row-odd',
                        isChecked && 'list-row-highlight',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggle(it.id)}
                        className="custom-checkbox"
                        aria-label={it.label}
                      />
                      <span className="flex-1 text-sm">{it.label}</span>
                      {it.prixUnit != null ? (
                        <span className="font-mono text-xs tabular-nums text-[var(--text-secondary-70)]">
                          {it.prixUnit.toFixed(2).replace('.', ',')} $
                        </span>
                      ) : null}
                    </label>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Annuler</Button>
          </DialogClose>
          <Button
            variant="primary"
            disabled={checked.size === 0}
            onClick={() => onConfirm({ kind, ids: Array.from(checked) })}
          >
            Ajouter ({checked.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
