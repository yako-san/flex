'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type Marque = {
  id: string;
  nom: string;
  /** Tailles disponibles pour cette marque (ex: ['XS', 'S', 'M', 'L', 'XL']). */
  taillesDisponibles?: string[];
};

export type VeloDraft = {
  marqueId: string | null;
  modele: string;
  couleur: string;
  taille: string | null;
};

type Props = {
  /** Liste des marques disponibles (ordre alphabétique). */
  marques: Marque[];
  value: VeloDraft;
  onChange: (next: VeloDraft) => void;
  /** Préfixe ID pour les inputs (utile si plusieurs instances dans la même page). */
  idPrefix?: string;
  disabled?: boolean;
  className?: string;
};

/**
 * Champs de formulaire « Nouveau Vélo » V1 — Marque (dropdown) + Modèle/Couleur
 * (libres) + Taille (dropdown selon marque).
 *
 * Pattern V1 (cf. v1-ui-bundle.md + remontée yako-san) : la **priorité** du
 * formulaire `/admin/inventaire/new` est de créer un nouveau vélo. La
 * réutilisation d'un vélo existant est secondaire (modal de recherche).
 *
 * Composant pur — aucune logique DB. Phase 3 fournira `marques` depuis le
 * server component parent.
 */
export function VeloFormFields({
  marques,
  value,
  onChange,
  idPrefix = 'velo',
  disabled,
  className,
}: Props) {
  const set = (patch: Partial<VeloDraft>) => onChange({ ...value, ...patch });

  const selectedMarque = marques.find((m) => m.id === value.marqueId);
  const taillesAvailable = selectedMarque?.taillesDisponibles ?? [];

  return (
    <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2', className)}>
      <div className="sm:col-span-2">
        <Label htmlFor={`${idPrefix}-marque`}>Marque</Label>
        <select
          id={`${idPrefix}-marque`}
          value={value.marqueId ?? ''}
          onChange={(e) => set({ marqueId: e.target.value || null, taille: null })}
          disabled={disabled || marques.length === 0}
          className={cn(
            'block w-full rounded-[var(--input-radius)] border-[1.5px] border-[var(--input-border)] bg-white px-[14px] py-2 outline-none transition-[border-color,box-shadow] duration-150',
            'md:text-sm',
            'focus:border-[var(--jaune)] focus:shadow-[0_0_0_3px_var(--input-focus-ring)]',
            'disabled:cursor-not-allowed disabled:bg-black/[0.04]',
          )}
          required
        >
          <option value="" disabled>
            — choisir —
          </option>
          {marques.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nom}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor={`${idPrefix}-modele`}>Modèle</Label>
        <Input
          id={`${idPrefix}-modele`}
          value={value.modele}
          onChange={(e) => set({ modele: e.target.value })}
          disabled={disabled}
          placeholder="ex: Lite 1"
        />
      </div>

      <div>
        <Label htmlFor={`${idPrefix}-couleur`}>Couleur</Label>
        <Input
          id={`${idPrefix}-couleur`}
          value={value.couleur}
          onChange={(e) => set({ couleur: e.target.value })}
          disabled={disabled}
          placeholder="ex: vert émeraude"
        />
      </div>

      <div>
        <Label htmlFor={`${idPrefix}-taille`}>Taille</Label>
        {taillesAvailable.length > 0 ? (
          <select
            id={`${idPrefix}-taille`}
            value={value.taille ?? ''}
            onChange={(e) => set({ taille: e.target.value || null })}
            disabled={disabled || !value.marqueId}
            className={cn(
              'block w-full rounded-[var(--input-radius)] border-[1.5px] border-[var(--input-border)] bg-white px-[14px] py-2 outline-none transition-[border-color,box-shadow] duration-150',
              'md:text-sm',
              'focus:border-[var(--jaune)] focus:shadow-[0_0_0_3px_var(--input-focus-ring)]',
              'disabled:cursor-not-allowed disabled:bg-black/[0.04]',
            )}
          >
            <option value="">— aucune —</option>
            {taillesAvailable.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        ) : (
          <Input
            id={`${idPrefix}-taille`}
            value={value.taille ?? ''}
            onChange={(e) => set({ taille: e.target.value || null })}
            disabled={disabled}
            placeholder="ex: M"
          />
        )}
      </div>
    </div>
  );
}
