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
      <label className="label-system">Nom canonique *</label>
      <input
        name="nomCanonical"
        defaultValue={v('nomCanonical')}
        placeholder='ex "Schwalbe, Marathon, 700C x 35"'
        required
        className="input-system"
      />
      {fe.nomCanonical ? <Err msg={fe.nomCanonical} /> : null}

      <div style={threeCol}>
        <div>
          <label className="label-system">Code legacy (v1)</label>
          <input name="legacyCode" defaultValue={v('legacyCode')} placeholder="P00001" className="input-system" />
        </div>
        <div>
          <label className="label-system">SKU</label>
          <input name="sku" defaultValue={v('sku')} placeholder="79-347" className="input-system" />
        </div>
        <div>
          <label className="label-system">Code-barre</label>
          <input name="codeBarre" defaultValue={v('codeBarre')} className="input-system" />
        </div>
      </div>

      <div style={twoCol}>
        <div>
          <label className="label-system">Catégorie</label>
          <input name="categorie" defaultValue={v('categorie')} placeholder="2. Transmission, Chaines" className="input-system" />
        </div>
        <div>
          <label className="label-system">Fournisseur</label>
          <input name="fournisseur" defaultValue={v('fournisseur')} placeholder="Babac, HLC, C&L..." className="input-system" />
        </div>
      </div>

      <div style={twoCol}>
        <div>
          <label className="label-system">Groupe (sous-classification optionnelle)</label>
          <input name="groupe" defaultValue={v('groupe')} placeholder="ex. 11-vit, 12-vit" className="input-system" />
        </div>
        <div>
          <label className="label-system">Notes (libres)</label>
          <input name="notes" defaultValue={v('notes')} placeholder="ex. Lot mars, à tester" className="input-system" />
        </div>
      </div>

      <h3 style={h3}>Prix</h3>
      <p style={{ fontSize: '0.78rem', color: '#888', marginTop: 0, marginBottom: '0.75rem' }}>
        Prix vente HT est utilisé sur les BDT et ventes. Les autres champs sont
        informationnels (analyse marges, achats, etc.).
      </p>
      <div style={threeCol}>
        <div>
          <label className="label-system">Prix achat</label>
          <input name="prixAchat" type="number" step="0.01" min="0" defaultValue={v('prixAchat')} className="input-system" />
        </div>
        <div>
          <label className="label-system">Prix base (groupe)</label>
          <input name="prixBase" type="number" step="0.01" min="0" defaultValue={v('prixBase')} className="input-system" />
        </div>
        <div>
          <label className="label-system">Prix vente HT *</label>
          <input
            name="prixVente"
            type="number"
            step="0.01"
            min="0"
            defaultValue={v('prixVente')}
            required
            className="input-system"
          />
          {fe.prixVente ? <Err msg={fe.prixVente} /> : null}
        </div>
      </div>
      <div style={twoCol}>
        <div>
          <label className="label-system">Prix cost (unitaire)</label>
          <input name="prixCost" type="number" step="0.01" min="0" defaultValue={v('prixCost')} className="input-system" />
        </div>
        <div>
          <label className="label-system">Prix BDC (cible vente)</label>
          <input name="prixBdc" type="number" step="0.01" min="0" defaultValue={v('prixBdc')} className="input-system" />
        </div>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
        <input type="checkbox" name="taxable" defaultChecked={initial?.taxable ?? true} />
        <span>Taxable (TPS + TVQ appliquées en facturation)</span>
      </label>

      <h3 style={h3}>Stock</h3>
      <div style={twoCol}>
        <div>
          <label className="label-system">Stock physique</label>
          <input
            name="stockPhysique"
            type="number"
            min="0"
            defaultValue={initial?.stockPhysique ?? 0}
            className="input-system"
          />
        </div>
        <div>
          <label className="label-system">Stock réservé (engagé sur BDT)</label>
          <input
            name="stockReserve"
            type="number"
            min="0"
            defaultValue={initial?.stockReserve ?? 0}
            className="input-system"
          />
        </div>
      </div>
      <p style={{ fontSize: '0.78rem', color: '#888', marginTop: '-0.4rem', marginBottom: '0.85rem' }}>
        ⚠️ La gestion dynamique du stock arrive en Phase 5. Pour l&apos;instant,
        c&apos;est une saisie manuelle.
      </p>

      {state?.error ? <div className="mb-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">{state.error}</div> : null}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? '…' : initial ? 'Enregistrer' : 'Créer la pièce'}
      </button>
    </form>
  );
}

function Err({ msg }: { msg: string }) {
  return <div style={{ color: '#c62828', fontSize: '0.85rem', marginTop: '-0.6rem', marginBottom: '0.5rem' }}>{msg}</div>;
}

const h3: React.CSSProperties = { fontSize: '1rem', marginTop: '1.5rem', marginBottom: '0.75rem', color: '#333' };
const twoCol: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' };
const threeCol: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' };
