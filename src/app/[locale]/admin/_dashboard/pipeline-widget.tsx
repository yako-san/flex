import * as React from 'react';

export type PipelineCard = {
  id: string;
  numero: number;
  who: string | null;
  status: PipelineStatus;
  /** True si l'item est en cours actif (anim pulse jaune). */
  active?: boolean;
};

export type PipelineStatus = 'RV' | 'RECU' | 'EVAL' | 'EN_ATTENTE' | 'APPROUVE' | 'ON_BENCH' | 'FACTURER';

const COLS: Array<{ key: PipelineStatus; label: string; bg: string }> = [
  { key: 'RV',         label: 'RV',         bg: 'st-bg-rv' },
  { key: 'RECU',       label: 'REÇU',       bg: 'st-bg-recu' },
  { key: 'EVAL',       label: 'ÉVAL',       bg: 'st-bg-eval' },
  { key: 'EN_ATTENTE', label: 'EN ATT.',    bg: 'st-bg-attente' },
  { key: 'APPROUVE',   label: 'APPR.',      bg: 'st-bg-approuve' },
  { key: 'ON_BENCH',   label: 'BENCH',      bg: 'st-bg-on-bench' },
  { key: 'FACTURER',   label: 'FACTURER',   bg: 'st-bg-facturer' },
];

type Props = {
  cards: PipelineCard[];
};

/**
 * Kanban 7 colonnes du Pipeline atelier — port du standalone (sans
 * l'animation auto). Pas d'auto-movement des cartes : snapshot statique
 * du moment courant. Chaque colonne = un statut V1.
 */
export function PipelineWidget({ cards }: Props) {
  const byStatus = new Map<PipelineStatus, PipelineCard[]>();
  for (const c of cards) {
    const arr = byStatus.get(c.status) ?? [];
    arr.push(c);
    byStatus.set(c.status, arr);
  }
  return (
    <div className="widget">
      <header className="widget-head">
        <span className="widget-title">Pipeline atelier</span>
        <span className="widget-meta">{cards.length} BDT</span>
      </header>
      <div className="widget-body">
        <div className="pipeline">
          {COLS.map((col) => {
            const list = byStatus.get(col.key) ?? [];
            return (
              <div key={col.key} className="pipe-col">
                <div className={`pipe-col-head ${col.bg}`}>
                  {col.label}
                  <span className="ct">{list.length}</span>
                </div>
                {list.slice(0, 4).map((c) => (
                  <div key={c.id} className={`pipe-card ${c.active ? 'active' : ''}`}>
                    <div className="id-row">{String(c.numero).padStart(4, '0')}</div>
                    {c.who ? <div className="who">{c.who}</div> : null}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
