import * as React from 'react';

type Props = {
  /** 7 valeurs (lundi → dimanche). Charge BDT par jour de semaine. */
  data: number[];
};

const LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const ROW_H = 28;

/**
 * Bar chart mini « Charge semaine » sous la carte Rendez-vous.
 * Vert si < 3 BDT, jaune si 3, rouge si ≥ 4. Port direct du standalone.
 */
export function HeatmapMini({ data }: Props) {
  const safe = data.length === 7 ? data : [0, 0, 0, 0, 0, 0, 0];
  const max = Math.max(...safe, 1);
  return (
    <div className="heatmap-mini">
      <div className="heatmap-title">Charge semaine</div>
      <div className="heatmap-grid" style={{ height: ROW_H }}>
        {safe.map((v, i) => {
          const h = Math.max(3, (v / max) * ROW_H);
          const color =
            v >= 4 ? 'var(--rouge)' : v >= 3 ? 'var(--jaune)' : v >= 1 ? 'var(--st-on-bench-bg)' : 'var(--gris-bord)';
          return (
            <div key={i} className="heatmap-col">
              <div className="heatmap-bar" style={{ background: color, height: `${h}px` }} />
              <span className="heatmap-label">{LABELS[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
