'use client';

import * as React from 'react';
import { KpiValue } from './kpi-value';

type Props = {
  /** Jusqu'à 14 derniers jours. Chaque entry = { day, total }. */
  series: Array<{ day: string; total: number }>;
  /** Delta % vs période précédente. Format `+24` (sans %). */
  deltaPct?: number | null;
};

/**
 * Sparkline grande surface — revenus 14 jours.
 * Montant en gros au-dessus + pill % delta + chart area smooth.
 */
export function RevenueWidget({ series, deltaPct }: Props) {
  const total = series.reduce((acc, p) => acc + p.total, 0);
  const data = series.map((p) => p.total);
  if (data.length < 2) data.push(0);

  // Build SVG path
  const width = 280;
  const height = 110;
  const max = Math.max(...data, 1);
  const dx = width / (data.length - 1);
  const points = data.map((v, i) => {
    const x = i * dx;
    const y = height - (v / max) * (height - 8) - 4;
    return [x, y] as const;
  });
  const path = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');
  const area = `${path} L${width},${height} L0,${height} Z`;

  return (
    <div className="widget">
      <header className="widget-head">
        <span className="widget-title">Revenus 14 jours</span>
      </header>
      <div className="widget-body spark-card">
        <div className="spark-top">
          <div className="spark-amount">
            <KpiValue value={total} money /><span className="unit"> $</span>
          </div>
          {deltaPct != null ? (
            <span className={`spark-delta ${deltaPct < 0 ? 'down' : ''}`}>
              {deltaPct >= 0 ? '+' : ''}{deltaPct}%
            </span>
          ) : null}
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="spark-svg" preserveAspectRatio="none" aria-hidden>
          <path d={area} fill="var(--st-approuve-bg)" opacity={0.25} />
          <path d={path} fill="none" stroke="var(--st-approuve-bg)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
