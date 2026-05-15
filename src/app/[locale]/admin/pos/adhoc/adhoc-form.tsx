'use client';

import { useActionState, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAdhocPoAction, type AdhocPoState } from '../actions';

type Piece = { id: string; nomCanonical: string; sku: string | null };

type Item = {
  pieceId: string;
  nom: string;
  sku: string;
  qty: string;
  unitPrice: string;
  categorie: string;
  notes: string;
};

const EMPTY_ITEM: Item = {
  pieceId: '',
  nom: '',
  sku: '',
  qty: '1',
  unitPrice: '0',
  categorie: '',
  notes: '',
};

type Props = { pieces: Piece[]; categories: string[] };

export function AdhocForm({ pieces, categories }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<AdhocPoState | null, FormData>(
    createAdhocPoAction,
    null,
  );
  const [items, setItems] = useState<Item[]>([{ ...EMPTY_ITEM }]);

  function update(idx: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function add() {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  }
  function remove(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }
  function applyPiece(idx: number, pieceId: string) {
    if (!pieceId) {
      update(idx, { pieceId: '' });
      return;
    }
    const p = pieces.find((x) => x.id === pieceId);
    if (p) {
      update(idx, { pieceId, nom: p.nomCanonical, sku: p.sku ?? '' });
    }
  }

  if (state?.ok && state.poNumero) {
    setTimeout(() => router.push(`/fr-CA/admin/pos/${state.poId}`), 500);
  }

  return (
    <form
      action={(fd: FormData) => {
        // Sérialise les items avant submit
        fd.set(
          'items',
          JSON.stringify(
            items
              .filter((it) => it.nom.trim() !== '')
              .map((it) => ({
                pieceId: it.pieceId || null,
                nom: it.nom,
                sku: it.sku || null,
                qty: Number(it.qty),
                unitPrice: Number(it.unitPrice),
                categorie: it.categorie || null,
                notes: it.notes || null,
              })),
          ),
        );
        formAction(fd);
      }}
    >
      <div style={{ marginBottom: '1rem' }}>
        <label className="label-system">Fournisseur *</label>
        <input name="fournisseur" required className="input-system" placeholder="Babac, MEC, etc." />
      </div>

      <h3 style={{ fontSize: '1.05rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
        Items reçus
      </h3>
      <p className="text-sm text-[var(--text-secondary-60)]" style={{ marginTop: 0, marginBottom: '0.75rem' }}>
        Si la pièce existe déjà au catalogue, sélectionne-la dans le dropdown
        (le nom et SKU se rempliront). Sinon laisse « — Nouvelle pièce — » et
        elle sera créée automatiquement (catégorie + prix d&apos;achat).
      </p>

      {items.map((it, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-[var(--gris-bord)] bg-white/60 p-4"
          style={{ marginBottom: '0.5rem' }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <div>
              <label className="label-system">Pièce existante</label>
              <select
                value={it.pieceId}
                onChange={(e) => applyPiece(idx, e.target.value)}
                className="input-system"
              >
                <option value="">— Nouvelle pièce —</option>
                {pieces.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku ? `[${p.sku}] ` : ''}{p.nomCanonical}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-system">Catégorie {!it.pieceId ? '(auto-création pièce)' : ''}</label>
              <input
                value={it.categorie}
                onChange={(e) => update(idx, { categorie: e.target.value })}
                list={`cats-${idx}`}
                className="input-system"
                placeholder="ex. Lubrification"
              />
              <datalist id={`cats-${idx}`}>
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <div>
              <label className="label-system">Nom *</label>
              <input
                value={it.nom}
                onChange={(e) => update(idx, { nom: e.target.value })}
                required
                className="input-system"
                placeholder="Description courte"
              />
            </div>
            <div>
              <label className="label-system">SKU</label>
              <input
                value={it.sku}
                onChange={(e) => update(idx, { sku: e.target.value })}
                className="input-system"
              />
            </div>
            <div>
              <label className="label-system">Qté *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={it.qty}
                onChange={(e) => update(idx, { qty: e.target.value })}
                required
                className="input-system"
              />
            </div>
            <div>
              <label className="label-system">Prix achat ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={it.unitPrice}
                onChange={(e) => update(idx, { unitPrice: e.target.value })}
                required
                className="input-system"
              />
            </div>
          </div>
          <div>
            <label className="label-system">Notes</label>
            <input
              value={it.notes}
              onChange={(e) => update(idx, { notes: e.target.value })}
              className="input-system"
              placeholder="ex. Lot mars, à tester"
            />
          </div>
          {items.length > 1 ? (
            <button
              type="button"
              onClick={() => remove(idx)}
              className="btn-danger text-xs"
              style={{ marginTop: '0.5rem' }}
            >
              ✕ Retirer cet item
            </button>
          ) : null}
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="btn-secondary text-xs"
        style={{ marginTop: '0.5rem' }}
      >
        + Ajouter un item
      </button>

      <div style={{ marginTop: '1rem' }}>
        <label className="label-system">Notes (PO entier)</label>
        <textarea name="notes" rows={2} className="input-system" placeholder="Note libre sur la réception" />
      </div>

      {state?.error ? (
        <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">{state.error}</div>
      ) : null}
      {state?.ok ? (
        <div className="mt-4 rounded-xl border border-green-300 bg-green-50 p-3 text-sm text-green-800">
          ✓ ADHOC <strong>{state.poNumero}</strong> créé. Redirection vers la fiche…
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="btn-primary"
        style={{ marginTop: '1rem' }}
      >
        {pending ? 'Création + réception en cours…' : '📦 Créer ADHOC + recevoir le stock'}
      </button>
    </form>
  );
}

