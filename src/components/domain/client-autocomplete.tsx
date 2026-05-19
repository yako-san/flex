'use client';

import * as React from 'react';
import { SearchIcon, XIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export type ClientSuggestion = {
  id: string;
  prenom: string;
  nom: string;
  telephone?: string | null;
  courriel?: string | null;
};

type Props = {
  /**
   * Fonction de recherche fournie par le parent. Idéalement un appel à
   * une API route `/api/admin/clients/search?q=…` ou un server action.
   * Doit retourner les clients matching le query (max ~10 résultats).
   */
  search: (query: string) => Promise<ClientSuggestion[]>;
  /** Sélection courante. */
  value: ClientSuggestion | null;
  onChange: (next: ClientSuggestion | null) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Délai de debounce (ms) avant déclencher search. */
  debounceMs?: number;
  className?: string;
  id?: string;
  /**
   * Slot pour offrir « Créer un nouveau client » sous la liste de
   * suggestions. Reçoit le `query` courant pour pré-remplir le formulaire.
   */
  createSlot?: (query: string, close: () => void) => React.ReactNode;
};

/**
 * Recherche live client V1 (amélioration V2 conservée — validée yako-san).
 *
 * Pattern :
 *   - Champ Input + dropdown suggestions
 *   - Debounce 200ms par défaut
 *   - Navigation clavier ↑/↓/Enter/Escape
 *   - Affiche prénom + nom + téléphone si présent
 *   - Slot « Créer nouveau » optionnel sous la liste
 *
 * Le parent fournit `search()` (server action ou fetch) — ce composant ne
 * connaît pas la source de données.
 */
export function ClientAutocomplete({
  search,
  value,
  onChange,
  placeholder = 'Rechercher un client…',
  disabled,
  debounceMs = 200,
  className,
  id,
  createSlot,
}: Props) {
  const [query, setQuery] = React.useState(value ? `${value.prenom} ${value.nom}`.trim() : '');
  const [open, setOpen] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<ClientSuggestion[]>([]);
  const [activeIdx, setActiveIdx] = React.useState(-1);
  const [loading, setLoading] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Debounced search
  React.useEffect(() => {
    if (!open) return;
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await search(query.trim());
        setSuggestions(res);
        setActiveIdx(res.length > 0 ? 0 : -1);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);
    return () => clearTimeout(handle);
  }, [query, open, search, debounceMs]);

  // Click outside → close
  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const select = (c: ClientSuggestion) => {
    onChange(c);
    setQuery(`${c.prenom} ${c.nom}`.trim());
    setOpen(false);
  };

  const clear = () => {
    onChange(null);
    setQuery('');
    setSuggestions([]);
    setOpen(false);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(suggestions.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      const item = suggestions[activeIdx];
      if (item) {
        e.preventDefault();
        select(item);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <SearchIcon
          width={16} height={16}
          aria-hidden
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary-50)]"
        />
        <Input
          id={id}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (value) onChange(null);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-9 pr-9"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
        />
        {query ? (
          <button
            type="button"
            onClick={clear}
            aria-label="Effacer"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--text-secondary-50)] hover:bg-black/5"
          >
            <XIcon width={14} height={14} />
          </button>
        ) : null}
      </div>

      {open && (loading || suggestions.length > 0 || query.trim().length >= 2) ? (
        <div
          role="listbox"
          className="absolute z-40 mt-1 w-full overflow-hidden rounded-xl border border-[var(--gris-bord)] bg-white shadow-lg"
        >
          {loading ? (
            <div className="px-3 py-2 text-sm text-[var(--text-secondary-60)]">Recherche…</div>
          ) : suggestions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-[var(--text-secondary-60)]">
              Aucun résultat
            </div>
          ) : (
            suggestions.map((c, idx) => (
              <button
                key={c.id}
                type="button"
                role="option"
                aria-selected={idx === activeIdx}
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => select(c)}
                className={cn(
                  'flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm transition-colors',
                  idx === activeIdx ? 'bg-[var(--overlay-light-85)]' : 'hover:bg-[var(--overlay-light-50)]',
                )}
              >
                <span className="font-semibold">
                  {c.prenom} {c.nom}
                </span>
                {c.telephone || c.courriel ? (
                  <span className="text-xs text-[var(--text-secondary-60)]">
                    {[c.telephone, c.courriel].filter(Boolean).join(' · ')}
                  </span>
                ) : null}
              </button>
            ))
          )}
          {createSlot ? (
            <div className="border-t border-[var(--gris-bord)] bg-[var(--gris-fond)] px-3 py-2">
              {createSlot(query, () => setOpen(false))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
