import * as React from 'react';
import Link from 'next/link';
import { PackageIcon } from '@/components/icons';

export type PieceToOrder = {
  id: string;
  name: string;
  sku: string | null;
  qty: number;
  locale: string;
};

type Props = {
  items: PieceToOrder[];
};

/**
 * Carte « Pièces — à commander » dense — port du standalone. Table 3
 * colonnes (pièce / sku / qté) avec scroll vertical interne. SKU
 * cliquable (lien vers la page pièce). Qté en pastille jaune ronde.
 */
export function PiecesACommanderCard({ items }: Props) {
  return (
    <div className="list-card pieces-card">
      <header className="widget-head">
        <span className="widget-title">
          <PackageIcon className="h-3 w-3" /> Pièces — à commander
        </span>
        <span className="count">{items.length}</span>
      </header>
      <div className="pieces-thead">
        <span>pièce</span>
        <span>sku</span>
        <span style={{ textAlign: 'right' }}>qté&nbsp;cmde</span>
      </div>
      <div className="pieces-body">
        {items.length === 0 ? (
          <p className="pieces-empty">Aucune pièce en rupture.</p>
        ) : (
          items.map((p) => (
            <div key={p.id} className="pieces-row">
              <span className="pn-name" title={p.name}>{p.name}</span>
              {p.sku ? (
                <Link
                  href={`/${p.locale}/admin/pieces/${p.id}` as never}
                  className="pn-sku"
                  title={`Ouvrir ${p.sku}`}
                >
                  {p.sku}
                </Link>
              ) : (
                <span className="pn-sku" style={{ borderBottom: 0 }}>—</span>
              )}
              <span className="pn-qty">{p.qty}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
