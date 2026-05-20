'use client';

import * as React from 'react';

type Props = {
  data: number[];
  color: string;
  /** Largeur du SVG en pixels. */
  width?: number;
  /** Hauteur du SVG en pixels. */
  height?: number;
};

/**
 * Sparkline SVG minimale (smoothed path + area fill alpha). Port de
 * `MiniSparkline` du standalone — pas d'animation, juste le rendu.
 */
export function MiniSparkline({ data, color, width = 70, height = 28 }: Props) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const dx = width / (data.length - 1);
  const points = data.map((v, i) => {
    const x = i * dx;
    const y = height - ((v - min) / range) * (height - 2) - 1;
    return [x, y] as const;
  });
  const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${path} L${width},${height} L0,${height} Z`;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className="kpi-sparkline"
      aria-hidden
    >
      <path d={area} fill={color} opacity={0.18} />
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
