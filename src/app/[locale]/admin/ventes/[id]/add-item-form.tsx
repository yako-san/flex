'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { addVenteItemAction, type VenteFormState } from '../actions';

type Entry = {
  /** `piece` ou `service` — sert au préfixe visuel et à l'envoi action. */
  kind: 'piece' | 'service';
  id: string;
  /** SKU (pieces) ou legacy code (services), affiché entre crochets. */
  sku: string | null;
  nom: string;
  /** Prix unitaire catalogue (pour le pré-remplissage du champ override). */
  prix: number;
};

type Props = {
  venteId: string;
  entries: Entry[];
};

const KIND_PREFIX = { piece: '⚙️', service: '🧰' } as const;

/**
 * Form V2 d'ajout d'item — port du picker V1 « Ajouter à la vente »
 * (cluster 4 items n + o, PR V1 #7 et #8) :
 *
 * - Picker unifié pièces + services avec préfixes visuels ⚙️/🧰
 * - Champ prix optionnel qui surcharge le prix catalogue (bouton 🆓 = 0)
 * - Quand prix override = 0, affichage "inclus" italique grisé
 *
 * Submit envoie `itemRef = "kind:id"` ; l'action serveur parse le kind
 * et route vers le bon snapshot (Service ou Piece).
 */
export function AddItemForm({ venteId, entries }: Props) {
  const [state, formAction, pending] = useActionState<VenteFormState | null, FormData>(
    addVenteItemAction,
    null,
  );

  const [selectedRef, setSelectedRef] = React.useState('');
  const [prixOverride, setPrixOverride] = React.useState('');

  const selectedEntry = React.useMemo(() => {
    if (!selectedRef) return null;
    return entries.find((e) => `${e.kind}:${e.id}` === selectedRef) ?? null;
  }, [selectedRef, entries]);

  // Reset le champ prix quand l'item change pour ne pas porter un override
  // qui n'a plus de sens. Le placeholder montre le prix catalogue courant.
  React.useEffect(() => {
    setPrixOverride('');
  }, [selectedRef]);

  const overrideZero = prixOverride === '0';

  return (
    <form
      action={formAction}
      style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}
    >
      <input type="hidden" name="venteId" value={venteId} />

      <div style={{ flex: '1 1 360px', minWidth: 240 }}>
        <label className="label-system">Pièce ou service</label>
        <select
          name="itemRef"
          required
          className="input-system"
          value={selectedRef}
          onChange={(e) => setSelectedRef(e.target.value)}
        >
          <option value="" disabled>
            — Choisir une pièce ou un service —
          </option>
          {entries.map((e) => (
            <option key={`${e.kind}:${e.id}`} value={`${e.kind}:${e.id}`}>
              {KIND_PREFIX[e.kind]} {e.sku ? `[${e.sku}] ` : ''}
              {e.nom} — {e.prix.toFixed(2)} $
            </option>
          ))}
        </select>
      </div>

      <div style={{ width: 100 }}>
        <label className="label-system">Qté</label>
        <input
          name="qty"
          type="number"
          step="1"
          min="1"
          defaultValue="1"
          required
          className="input-system"
        />
      </div>

      {/* Prix override + bouton 🆓 — visible uniquement quand un item est
          sélectionné, pour ne pas confondre l'utilisateur. */}
      <div style={{ width: 140 }}>
        <label className="label-system">
          Prix unit.{' '}
          {overrideZero ? (
            <span className="italic text-[var(--text-secondary-60)]">(inclus)</span>
          ) : null}
        </label>
        <div className="flex items-center gap-1">
          <input
            name="prixOverride"
            type="number"
            step="0.01"
            min="0"
            placeholder={selectedEntry ? selectedEntry.prix.toFixed(2) : '—'}
            value={prixOverride}
            onChange={(e) => setPrixOverride(e.target.value)}
            disabled={!selectedEntry}
            className="input-system"
            style={{ flex: 1 }}
          />
          <button
            type="button"
            onClick={() => setPrixOverride(overrideZero ? '' : '0')}
            disabled={!selectedEntry}
            title={
              overrideZero
                ? 'Revenir au prix catalogue'
                : 'Mettre à 0 (inclus dans un forfait, décrémente le stock)'
            }
            aria-pressed={overrideZero}
            className={
              overrideZero
                ? 'inline-flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[var(--jaune)] text-[var(--dark)] shadow-sm disabled:opacity-50'
                : 'inline-flex h-[38px] w-[38px] items-center justify-center rounded-full bg-black/10 text-[var(--text-secondary-70)] hover:bg-black/20 disabled:opacity-50'
            }
          >
            <span aria-hidden style={{ fontSize: 16 }}>
              🆓
            </span>
            <span className="sr-only">Marquer comme inclus (prix 0)</span>
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="btn-primary"
        style={{ height: 38 }}
      >
        {pending ? 'Ajout…' : '+ Ajouter'}
      </button>

      {state?.error ? (
        <div style={{ width: '100%' }} className="mt-1 text-xs text-red-600">
          {state.error}
        </div>
      ) : null}
    </form>
  );
}
