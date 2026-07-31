import api from './axios';

/** KPI con periodo actual vs periodo anterior de la misma duración. */
export interface AdminKpiDelta {
  value: number;
  previous: number;
}

export interface AdminStatsOverview {
  period: {
    from: string;
    to: string;
    previousFrom: string;
    previousTo: string;
  };
  kpis: {
    newUsers: AdminKpiDelta;
    newPros: AdminKpiDelta;
    newRequests: AdminKpiDelta;
    newBids: AdminKpiDelta;
    acceptedBids: AdminKpiDelta;
    completedRequests: AdminKpiDelta;
    activePaidSubscriptions: AdminKpiDelta;
    cancelAtPeriodEnd: { value: number };
  };
  funnel: {
    registered: number;
    phoneVerified: number;
    firstRequest: number;
    firstBid: number;
    acceptedJob: number;
    completedJob: number;
    reviewed: number;
  };
  queues: {
    pendingApproval: number;
    pendingVisitRequests: number;
  };
  timeseries: {
    grain: 'day';
    points: Array<{
      date: string;
      newUsers: number;
      newRequests: number;
      newBids: number;
      acceptedBids: number;
    }>;
  };
}

export type AdminStatsRange = '7d' | '30d' | '90d';

function toIsoDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Rango civil inclusivo ending today (local). */
export function adminRangeToFromTo(
  range: AdminStatsRange,
  today: Date = new Date(),
): { from: string; to: string } {
  const end = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const days = range === '7d' ? 6 : range === '30d' ? 29 : 89;
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  return { from: toIsoDate(start), to: toIsoDate(end) };
}

export async function fetchAdminStatsOverview(
  range: AdminStatsRange,
): Promise<AdminStatsOverview> {
  const { from, to } = adminRangeToFromTo(range);
  const { data } = await api.get<AdminStatsOverview>('/admin/stats/overview', {
    params: { from, to },
    headers: { Accept: 'application/json' },
  });
  return data;
}

export function kpiDeltaPercent(kpi: AdminKpiDelta): number | null {
  if (!Number.isFinite(kpi.previous) || kpi.previous === 0) {
    if (kpi.value === 0) return 0;
    return null;
  }
  return ((kpi.value - kpi.previous) / kpi.previous) * 100;
}
