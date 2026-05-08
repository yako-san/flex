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
        <label style={lbl}>Fournisseur *</label>
        <input name="fournisseur" required style={inp} placeholder="Babac, MEC, etc." />
      </div>

      <h3 style={{ fontSize: '1.05rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
        Items reçus
      </h3>
      <p style={{ color: '#666', fontSize: '0.85rem', marginTop: 0, marginBottom: '0.75rem' }}>
        Si la pièce existe déjà au catalogue, sélectionne-la dans le dropdown
        (le nom et SKU se rempliront). Sinon laisse « — Nouvelle pièce — » et
        elle sera créée automatiquement (catégorie + prix d&apos;achat).
      </p>

      {items.map((it, idx) => (
        <div
          key={idx}
          style={{
            background: '#fafafa',
            border: '1px solid #e0e0e0',
            borderRadius: 6,
            padding: '0.75rem',
            marginBottom: '0.5rem',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <div>
              <label style={lbl}>Pièce existante</label>
              <select
                value={it.pieceId}
                onChange={(e) => applyPiece(idx, e.target.value)}
                style={inp}
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
              <label style={lbl}>Catégorie {!it.pieceId ? '(auto-création pièce)' : ''}</label>
              <input
                value={it.categorie}
                onChange={(e) => update(idx, { categorie: e.target.value })}
                list={`cats-${idx}`}
                style={inp}
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
              <label style={lbl}>Nom *</label>
              <input
                value={it.nom}
                onChange={(e) => update(idx, { nom: e.target.value })}
                required
                style={inp}
                placeholder="Description courte"
              />
            </div>
            <div>
              <label style={lbl}>SKU</label>
              <input
                value={it.sku}
                onChange={(e) => update(idx, { sku: e.target.value })}
                style={inp}
              />
            </div>
            <div>
              <label style={lbl}>Qté *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={it.qty}
                onChange={(e) => update(idx, { qty: e.target.value })}
                required
                style={inp}
              />
            </div>
            <div>
              <label style={lbl}>Prix achat ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={it.unitPrice}
                onChange={(e) => update(idx, { unitPrice: e.target.value })}
                required
                style={inp}
              />
            </div>
          </div>
          <div>
            <label style={lbl}>Notes</label>
            <input
              value={it.notes}
              onChange={(e) => update(idx, { notes: e.target.value })}
              style={inp}
              placeholder="ex. Lot mars, à tester"
            />
          </div>
          {items.length > 1 ? (
            <button
              type="button"
              onClick={() => remove(idx)}
              style={{
                marginTop: '0.5rem',
                padding: '0.3rem 0.6rem',
                background: 'transparent',
                color: '#c62828',
                border: '1px solid #ef9a9a',
                borderRadius: 4,
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              ✕ Retirer cet item
            </button>
          ) : null}
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        style={{
          padding: '0.45rem 0.9rem',
          background: 'transparent',
          color: '#1565c0',
          border: '1px dashed #1565c0',
          borderRadius: 4,
          cursor: 'pointer',
          fontSize: '0.85rem',
          marginTop: '0.5rem',
        }}
      >
        + Ajouter un item
      </button>

      <div style={{ marginTop: '1rem' }}>
        <label style={lbl}>Notes (PO entier)</label>
        <textarea name="notes" rows={2} style={inp} placeholder="Note libre sur la réception" />
      </div>

      {state?.error ? (
        <div style={errBox}>{state.error}</div>
      ) : null}
      {state?.ok ? (
        <div style={successBox}>
          ✓ ADHOC <strong>{state.poNumero}</strong> créé. Redirection vers la fiche…
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        style={{
          marginTop: '1rem',
          padding: '0.7rem 1.5rem',
          fontSize: '0.95rem',
          background: pending ? '#999' : '#2e7d32',
          color: 'white',
          border: 0,
          borderRadius: 4,
          cursor: pending ? 'wait' : 'pointer',
          fontWeight: 600,
        }}
      >
        {pending ? 'Création + réception en cours…' : '📦 Créer ADHOC + recevoir le stock'}
      </button>
    </form>
  );
}

const lbl: React.CSSProperties = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 500,
  color: '#444',
  marginBottom: '0.2rem',
};
const inp: React.CSSProperties = {
  width: '100%',
  padding: '0.4rem 0.5rem',
  fontSize: '0.9rem',
  border: '1px solid #ccc',
  borderRadius: 4,
  background: 'white',
};
const errBox: React.CSSProperties = {
  marginTop: '1rem',
  padding: '0.75rem',
  background: '#ffebee',
  border: '1px solid #f44336',
  color: '#c62828',
  borderRadius: 4,
};
const successBox: React.CSSProperties = {
  marginTop: '1rem',
  padding: '0.75rem',
  background: '#e8f5e9',
  border: '1px solid #2e7d32',
  color: '#1b5e20',
  borderRadius: 4,
};
