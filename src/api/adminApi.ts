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

/* ---------- Fase 2: solicitudes ---------- */

export type AdminRequestStatusFilter =
  | 'ALL'
  | 'PENDING_APPROVAL'
  | 'PENDING'
  | 'ACCEPTED'
  | 'COMPLETED';

export interface AdminRequestListItem {
  id: number;
  title: string;
  status: string;
  category: string | null;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  bidCount: number;
  estimatedPriceMin: number | null;
  estimatedPriceMax: number | null;
  createdAt: string;
  clientName: string | null;
  clientEmail: string | null;
  aiSafe: boolean | null;
  aiInScope: boolean | null;
}

export interface AdminRequestBidSummary {
  id: number;
  status: string;
  pricingType: string | null;
  priceQuote: number | null;
  priceQuoteMin: number | null;
  priceQuoteMax: number | null;
  professionalName: string | null;
  createdAt: string;
}

export interface AdminRequestDetail extends AdminRequestListItem {
  description: string | null;
  clientOriginalDescription: string | null;
  address: string | null;
  desiredExecutionTime: string | null;
  photoUrl: string | null;
  videoUrl: string | null;
  audioUrl: string | null;
  extraPhotoUrls: string[];
  extraVideoUrls: string[];
  extraAudioUrls: string[];
  aiSafetyReason: string | null;
  aiOutOfScopeReason: string | null;
  aiDiagnosis: Record<string, unknown> | null;
  assignedProfessionalName: string | null;
  bids: AdminRequestBidSummary[];
}

export interface AdminRequestListResponse {
  items: AdminRequestListItem[];
  total: number;
  page: number;
  itemsPerPage: number;
}

export interface FetchAdminRequestsParams {
  status?: AdminRequestStatusFilter;
  q?: string;
  page?: number;
  itemsPerPage?: number;
}

const adminJsonHeaders = { Accept: 'application/json' };

export async function fetchAdminRequests(
  params: FetchAdminRequestsParams = {},
): Promise<AdminRequestListResponse> {
  const { status = 'ALL', q, page = 1, itemsPerPage = 20 } = params;
  const { data } = await api.get<AdminRequestListResponse>('/admin/requests', {
    params: {
      status: status === 'ALL' ? undefined : status,
      q: q?.trim() || undefined,
      page,
      itemsPerPage,
    },
    headers: adminJsonHeaders,
  });
  return data;
}

export async function fetchAdminRequestDetail(
  id: number,
): Promise<AdminRequestDetail> {
  const { data } = await api.get<AdminRequestDetail>(`/admin/requests/${id}`, {
    headers: adminJsonHeaders,
  });
  return data;
}

/** PENDING_APPROVAL → PENDING (publicar en mercado). */
export async function approveAdminRequest(id: number): Promise<AdminRequestDetail> {
  const { data } = await api.post<AdminRequestDetail>(
    `/admin/requests/${id}/approve`,
    {},
    { headers: adminJsonHeaders },
  );
  return data;
}

/** Rechaza moderación: elimina / cancela la solicitud. */
export async function rejectAdminRequest(
  id: number,
  reason?: string,
): Promise<void> {
  await api.post(
    `/admin/requests/${id}/reject`,
    reason?.trim() ? { reason: reason.trim() } : {},
    { headers: adminJsonHeaders },
  );
}

/** Cancelación administrativa (p. ej. PENDING sin publicar). */
export async function cancelAdminRequest(id: number): Promise<void> {
  await api.post(
    `/admin/requests/${id}/cancel`,
    {},
    { headers: adminJsonHeaders },
  );
}
