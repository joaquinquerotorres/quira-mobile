import React, { useMemo } from 'react';
import type { AdminStatsOverview } from '../../api/adminApi';

type SeriesKey = 'newUsers' | 'newRequests' | 'newBids' | 'acceptedBids';

const SERIES: { key: SeriesKey; label: string; color: string }[] = [
  { key: 'newUsers', label: 'Altas', color: '#4f46e5' },
  { key: 'newRequests', label: 'Solicitudes', color: '#f97316' },
  { key: 'newBids', label: 'Ofertas', color: '#0ea5e9' },
  { key: 'acceptedBids', label: 'Aceptadas', color: '#10b981' },
];

interface AdminTimeseriesChartProps {
  points: AdminStatsOverview['timeseries']['points'];
}

/** Gráfico de líneas SVG ligero (sin dependencia externa). */
export const AdminTimeseriesChart: React.FC<AdminTimeseriesChartProps> = ({
  points,
}) => {
  const { paths, maxY, width, height, pad } = useMemo(() => {
    const w = 320;
    const h = 140;
    const p = { t: 8, r: 8, b: 20, l: 28 };
    const innerW = w - p.l - p.r;
    const innerH = h - p.t - p.b;
    const max = Math.max(
      1,
      ...points.flatMap((pt) =>
        SERIES.map((s) => Number(pt[s.key]) || 0),
      ),
    );
    const n = Math.max(points.length - 1, 1);
    const buildPath = (key: SeriesKey) =>
      points
        .map((pt, i) => {
          const x = p.l + (i / n) * innerW;
          const y = p.t + innerH - ((Number(pt[key]) || 0) / max) * innerH;
          return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');
    return {
      width: w,
      height: h,
      pad: p,
      maxY: max,
      paths: SERIES.map((s) => ({ ...s, d: buildPath(s.key) })),
    };
  }, [points]);

  if (!points.length) {
    return <p className="admin-muted">Sin puntos en el periodo.</p>;
  }

  return (
    <div className="admin-chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Tendencias del periodo"
        className="admin-chart-svg"
      >
        {[0, 0.5, 1].map((t) => {
          const y = pad.t + (1 - t) * (height - pad.t - pad.b);
          return (
            <g key={t}>
              <line
                x1={pad.l}
                x2={width - pad.r}
                y1={y}
                y2={y}
                className="admin-chart-grid"
              />
              <text x={4} y={y + 3} className="admin-chart-axis">
                {Math.round(maxY * t)}
              </text>
            </g>
          );
        })}
        {paths.map((s) => (
          <path key={s.key} d={s.d} fill="none" stroke={s.color} strokeWidth={2} />
        ))}
      </svg>
      <div className="admin-chart-legend">
        {SERIES.map((s) => (
          <span key={s.key}>
            <i style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
};
