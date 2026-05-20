import * as React from 'react';

type Row = {
  id?: string;
  content: React.ReactNode;
  pill?: { v: string; l: string };
  right?: string;
  red?: boolean;
  faded?: boolean;
};

type Props = {
  icon: React.ReactNode;
  title: string;
  count: number;
  rows: Row[];
  /** Contenu additionnel rendu sous les rangées (ex: Charge semaine). */
  extra?: React.ReactNode;
  /** Footer optionnel (lien « voir tout », etc.). */
  footer?: React.ReactNode;
};

/**
 * Carte liste compacte — port direct du standalone (`ListCard`).
 * Chaque rangée a un ID optionnel (bold), content (ellipsis), pill
 * statut OU right (montant aligné droite avec variante `red`).
 */
export function ListCard({ icon, title, count, rows, extra, footer }: Props) {
  return (
    <div className="list-card">
      <header className="widget-head">
        <span className="widget-title">
          {icon} {title}
        </span>
        <span className="count">{count}</span>
      </header>
      <div className="body">
        {rows.map((r, i) => (
          <div key={i} className={`lrow ${r.faded ? 'faded' : ''}`}>
            {r.id ? <span className="id">{r.id}</span> : null}
            <span className="content">{r.content}</span>
            {r.pill ? <span className={`pill ${r.pill.v}`}>{r.pill.l}</span> : null}
            {r.right ? <span className={`right ${r.red ? 'red' : ''}`}>{r.right}</span> : null}
          </div>
        ))}
        {extra}
        {footer ? <div className="list-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
