'use client';

import * as React from 'react';

type Props = {
  value: number;
  /** Formate en `1 234,56` au lieu de simple count. */
  money?: boolean;
  /** Durée de l'animation count-up en ms. */
  durationMs?: number;
};

/**
 * Count-up animé via `requestAnimationFrame`. Port de `useCountUp` du
 * standalone (qui utilisait setTimeout à cause de l'iframe d'aperçu) —
 * en prod browser normal, rAF est plus smooth.
 */
export function KpiValue({ value, money = false, durationMs = 700 }: Props) {
  const [v, setV] = React.useState(0);
  React.useEffect(() => {
    let cancelled = false;
    const t0 = performance.now();
    function tick(t: number) {
      if (cancelled) return;
      const p = Math.min(1, (t - t0) / durationMs);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - p, 3);
      setV(value * eased);
      if (p < 1) requestAnimationFrame(tick);
      else setV(value);
    }
    requestAnimationFrame(tick);
    return () => {
      cancelled = true;
    };
  }, [value, durationMs]);

  if (money) {
    return <span className="count-up">{Math.round(v).toLocaleString('fr-CA')}</span>;
  }
  return <span className="count-up">{Math.round(v)}</span>;
}
