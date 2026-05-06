'use client';

import { useActionState } from 'react';
import {
  createPieceAction,
  updatePieceAction,
  type PieceFormState,
} from './actions';
import type { Piece } from '@prisma/client';

type Props = { initial?: Piece };

export function PieceForm({ initial }: Props) {
  const action = initial
    ? updatePieceAction.bind(null, initial.id)
    : createPieceAction;
  const [state, formAction, pending] = useActionState<PieceFormState | null, FormData>(action, null);
  const fe = state?.fieldErrors ?? {};
  const v = (k: keyof Piece): string =>
    initial && initial[k] != null ? String(initial[k]) : '';

  return (
    <form action={formAction} style={{ maxWidth: 800 }}>
      <h3 style={h3}>Identification</h3>
      <label style={lbl}>Nom canonique *</label>
      <input
        name="nomCanonical"
        defaultValue={v('nomCanonical')}
        placeholder='ex "Schwalbe, Marathon, 700C x 35"'
        required
        style={inp}
      />
      {fe.nomCanonical ? <Err msg={fe.nomCanonical} /> : null}

      <div style={threeCol}>
        <div>
          <label style={lbl}>Code legacy (v1)</label>
          <input name="legacyCode" defaultValue={v('legacyCode')} placeholder="P00001" style={inp} />
        </div>
        <div>
          <label style={lbl}>SKU</label>
          <input name="sku" defaultValue={v('sku')} placeholder="79-347" style={inp} />
        </div>
        <div>
          <label style={lbl}>Code-barre</label>
          <input name="codeBarre" defaultValue={v('codeBarre')} style={inp} />
        </div>
      </div>

      <div style={twoCol}>
        <div>
          <label style={lbl}>Catégorie</label>
          <input name="categorie" defaultValue={v('categorie')} placeholder="2. Transmission, Chaines" style={inp} />
        </div>
        <div>
          <label style={lbl}>Fournisseur</label>
          <input name="fournisseur" defaultValue={v('fournisseur')} placeholder="Babac, HLC, C&L..." style={inp} />
        </div>
      </div>

      <h3 style={h3}>Prix</h3>
      <p style={{ fontSize: '0.78rem', color: '#888', marginTop: 0, marginBottom: '0.75rem' }}>
        Prix vente HT est utilisé sur les BDT et ventes. Les autres champs sont
        informationnels (analyse marges, achats, etc.).
      </p>
      <div style={threeCol}>
        <div>
          <label style={lbl}>Prix achat</label>
          <input name="prixAchat" type="number" step="0.01" min="0" defaultValue={v('prixAchat')} style={inp} />
        </div>
        <div>
          <label style={lbl}>Prix base (groupe)</label>
          <input name="prixBase" type="number" step="0.01" min="0" defaultValue={v('prixBase')} style={inp} />
        </div>
        <div>
          <label style={lbl}>Prix vente HT *</label>
          <input
            name="prixVente"
            type="number"
            step="0.01"
            min="0"
            defaultValue={v('prixVente')}
            required
            style={inp}
          />
          {fe.prixVente ? <Err msg={fe.prixVente} /> : null}
        </div>
      </div>
      <div style={twoCol}>
        <div>
          <label style={lbl}>Prix cost (unitaire)</label>
          <input name="prixCost" type="number" step="0.01" min="0" defaultValue={v('prixCost')} style={inp} />
        </div>
        <div>
          <label style={lbl}>Prix BDC (cible vente)</label>
          <input name="prixBdc" type="number" step="0.01" min="0" defaultValue={v('prixBdc')} style={inp} />
        </div>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
        <input type="checkbox" name="taxable" defaultChecked={initial?.taxable ?? true} />
        <span>Taxable (TPS + TVQ appliquées en facturation)</span>
      </label>

      <h3 style={h3}>Stock</h3>
      <div style={twoCol}>
        <div>
          <label style={lbl}>Stock physique</label>
          <input
            name="stockPhysique"
            type="number"
            min="0"
            defaultValue={initial?.stockPhysique ?? 0}
            style={inp}
          />
        </div>
        <div>
          <label style={lbl}>Stock réservé (engagé sur BDT)</label>
          <input
            name="stockReserve"
            type="number"
            min="0"
            defaultValue={initial?.stockReserve ?? 0}
            style={inp}
          />
        </div>
      </div>
      <p style={{ fontSize: '0.78rem', color: '#888', marginTop: '-0.4rem', marginBottom: '0.85rem' }}>
        ⚠️ La gestion dynamique du stock arrive en Phase 5. Pour l&apos;instant,
        c&apos;est une saisie manuelle.
      </p>

      {state?.error ? <div style={errBox}>{state.error}</div> : null}

      <button type="submit" disabled={pending} style={btn(pending)}>
        {pending ? '…' : initial ? 'Enregistrer' : 'Créer la pièce'}
      </button>
    </form>
  );
}

function Err({ msg }: { msg: string }) {
  return <div style={{ color: '#c62828', fontSize: '0.85rem', marginTop: '-0.6rem', marginBottom: '0.5rem' }}>{msg}</div>;
}

const lbl: React.CSSProperties = { display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#444', marginBottom: '0.3rem' };
const inp: React.CSSProperties = { width: '100%', padding: '0.5rem 0.6rem', fontSize: '0.95rem', border: '1px solid #ccc', borderRadius: 4, marginBottom: '0.85rem', background: 'white' };
const h3: React.CSSProperties = { fontSize: '1rem', marginTop: '1.5rem', marginBottom: '0.75rem', color: '#333' };
const twoCol: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' };
const threeCol: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' };
const errBox: React.CSSProperties = { background: '#ffebee', border: '1px solid #f44336', color: '#c62828', padding: '0.6rem', borderRadius: 4, marginBottom: '0.75rem' };
const btn = (p: boolean): React.CSSProperties => ({ padding: '0.6rem 1.2rem', background: p ? '#999' : '#1a1a1a', color: 'white', border: 0, borderRadius: 4, cursor: p ? 'wait' : 'pointer', fontSize: '0.95rem' });
