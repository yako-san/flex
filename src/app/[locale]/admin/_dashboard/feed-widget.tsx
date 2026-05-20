import * as React from 'react';

export type FeedItem = {
  id: string;
  who: string;
  what: string;
  /** Couleur du dot devant le texte (`var(--st-*-bg)`). */
  dotColor: string;
  /** Temps relatif (ex: « il y a 2 min »). */
  time: string;
};

type Props = {
  items: FeedItem[];
};

/**
 * Feed d'activité atelier — port direct du standalone (sans la
 * simulation live-update qui ajoutait des items toutes les 4s). Liste
 * statique des N dernières actions. Item.dotColor = couleur du dot pour
 * différencier le type d'action.
 */
export function FeedWidget({ items }: Props) {
  return (
    <div className="widget">
      <header className="widget-head">
        <span className="widget-title">Activité atelier</span>
        <span className="widget-meta">{items.length} récents</span>
      </header>
      <div className="widget-body feed">
        {items.length === 0 ? (
          <p className="feed-empty">Aucune activité récente.</p>
        ) : (
          items.map((it) => (
            <div key={it.id} className="feed-item">
              <span className="feed-dot" style={{ background: it.dotColor }} />
              <div className="feed-body">
                <span className="who">{it.who}</span>{' '}
                <span className="what">{it.what}</span>
              </div>
              <span className="feed-time">{it.time}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
