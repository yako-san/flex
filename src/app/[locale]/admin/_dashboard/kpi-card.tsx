import * as React from 'react';
import { KpiValue } from './kpi-value';
import { MiniSparkline } from './mini-sparkline';

type Props = {
  icon: React.ReactNode;
  iconBg: string;
  iconFg?: string;
  label: string;
  value: number;
  money?: boolean;
  sub?: React.ReactNode;
  pills?: React.ReactNode;
  spark?: number[];
  sparkColor?: string;
  trend?: string;
  trendDir?: 'up' | 'down';
};

/**
 * Carte KPI compacte du Dashboard. Icône ronde colorée + label
 * lowercase + valeur jaune large count-up + sub/pills + sparkline
 * en bas-droite. Port direct du standalone.
 */
export function KpiCard({
  icon,
  iconBg,
  iconFg = '#000',
  label,
  value,
  money = false,
  sub,
  pills,
  spark,
  sparkColor,
  trend,
  trendDir = 'up',
}: Props) {
  return (
    <div className="kpi">
      <div className="kpi-head">
        <span className="kpi-ic" style={{ background: iconBg, color: iconFg }}>
          {icon}
        </span>
        <span className="kpi-label">{label}</span>
        {trend ? (
          <span className={`kpi-trend ${trendDir === 'down' ? 'down' : ''}`}>
            {trendDir === 'down' ? '▾' : '▴'} {trend}
          </span>
        ) : null}
      </div>
      <div className="kpi-value">
        {money ? (
          <>
            <KpiValue value={value} money />
            <span className="unit"> $</span>
          </>
        ) : (
          <KpiValue value={value} />
        )}
      </div>
      {sub ? <div className="kpi-sub">{sub}</div> : null}
      {pills ? <div className="kpi-pills">{pills}</div> : null}
      {spark && sparkColor ? <MiniSparkline data={spark} color={sparkColor} /> : null}
    </div>
  );
}
