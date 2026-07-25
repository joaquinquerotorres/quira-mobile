import api from './axios';
import type { CalendarEvent, HydraCollection, ServiceRequest } from '../types';

function hydraMembers<T>(data: HydraCollection<T> | T[]): T[] {
  if (Array.isArray(data)) return data;
  return data['hydra:member'] || data.member || [];
}

export function requestIri(requestId: number): string {
  return `/api/requests/${requestId}`;
}

/** YYYY-MM-DD en zona local. */
export function toLocalDateString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** YYYY-MM-DDTHH:mm:ss en zona local (sin zona), para API Platform. */
export function toLocalDateTimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${toLocalDateString(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/** Parsea ISO o local datetime a Date en zona local. */
export function parseStartsAt(value: string): Date {
  // "2026-08-01T09:30:00+00:00" / "...Z" → Date nativo
  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(value)) {
    return new Date(value);
  }
  // "2026-08-01T09:30:00" o "2026-08-01 09:30:00" → local
  const m = value.match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/,
  );
  if (m) {
    return new Date(
      Number(m[1]),
      Number(m[2]) - 1,
      Number(m[3]),
      Number(m[4]),
      Number(m[5]),
      Number(m[6] ?? 0),
    );
  }
  const [y, mo, d] = value.slice(0, 10).split('-').map(Number);
  return new Date(y, mo - 1, d);
}

export async function listCalendarEvents(params?: {
  startsAtAfter?: string;
  startsAtBefore?: string;
  requestIri?: string;
}): Promise<CalendarEvent[]> {
  const query = new URLSearchParams();
  if (params?.startsAtAfter) {
    query.set('startsAt[after]', params.startsAtAfter);
  }
  if (params?.startsAtBefore) {
    query.set('startsAt[before]', params.startsAtBefore);
  }
  if (params?.requestIri) {
    query.set('request', params.requestIri);
  }
  const qs = query.toString();
  const res = await api.get(`/calendar_events${qs ? `?${qs}` : ''}`);
  return hydraMembers<CalendarEvent>(res.data);
}

export async function getCalendarEventForRequest(
  requestId: number,
): Promise<CalendarEvent | null> {
  const events = await listCalendarEvents({
    requestIri: requestIri(requestId),
  });
  return events[0] ?? null;
}

export async function createCalendarEvent(input: {
  requestId: number;
  startsAt: string;
  notes?: string | null;
}): Promise<CalendarEvent> {
  const res = await api.post('/calendar_events', {
    request: requestIri(input.requestId),
    startsAt: input.startsAt,
    notes: input.notes ?? null,
  });
  return res.data;
}

export async function updateCalendarEvent(
  id: number,
  input: { startsAt: string; notes?: string | null },
): Promise<CalendarEvent> {
  const res = await api.patch(
    `/calendar_events/${id}`,
    {
      startsAt: input.startsAt,
      notes: input.notes ?? null,
    },
    { headers: { 'Content-Type': 'application/merge-patch+json' } },
  );
  return res.data;
}

export async function deleteCalendarEvent(id: number): Promise<void> {
  await api.delete(`/calendar_events/${id}`);
}

export async function listWonJobs(): Promise<ServiceRequest[]> {
  const res = await api.get('/requests?my_jobs=true');
  return hydraMembers<ServiceRequest>(res.data);
}
