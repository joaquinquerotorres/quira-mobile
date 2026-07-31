import React from 'react';
import type { AdminStatsOverview } from '../../api/adminApi';

const STEPS: { key: keyof AdminStatsOverview['funnel']; label: string }[] = [
  { key: 'registered', label: 'Registros' },
  { key: 'phoneVerified', label: 'Tel. verificado' },
  { key: 'firstRequest', label: '1ª solicitud' },
  { key: 'firstBid', label: '1ª oferta' },
  { key: 'acceptedJob', label: 'Trabajo aceptado' },
  { key: 'completedJob', label: 'Completado' },
  { key: 'reviewed', label: 'Con review' },
];

interface AdminFunnelProps {
  funnel: AdminStatsOverview['funnel'];
}

export const AdminFunnel: React.FC<AdminFunnelProps> = ({ funnel }) => {
  const max = Math.max(1, ...STEPS.map((s) => Number(funnel[s.key]) || 0));

  return (
    <div className="admin-funnel">
      {STEPS.map((step) => {
        const value = Number(funnel[step.key]) || 0;
        const pct = Math.round((value / max) * 100);
        return (
          <div key={step.key} className="admin-funnel-row">
            <div className="admin-funnel-meta">
              <span>{step.label}</span>
              <strong>{value}</strong>
            </div>
            <div className="admin-funnel-track">
              <div className="admin-funnel-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
