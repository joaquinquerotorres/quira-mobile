import api from './axios';
import type { CalendarEvent, HydraCollection, ServiceRequest } from '../types';

function hydraMembers<T>(data: HydraCollection<T> | T[]): T[] {
  if (Array.isArray(data)) return data;
  return data['hydra:member'] || data.member || [];
}

export function requestIri(requestId: number): string {
  return `/api/requests/${requestId}`;
}

/**
 * Extrae el id numérico de `event.request` (objeto con id, IRI o string IRI).
 * Si falla, el calendario no puede desduplicar ni enlazar al detalle.
 */
export function calendarEventRequestId(
  request: CalendarEvent['request'] | string | null | undefined,
): number | null {
  if (request == null) return null;
  if (typeof request === 'number' && Number.isFinite(request)) {
    return request;
  }
  if (typeof request === 'string') {
    const parts = request.split('/');
    const n = parseInt(parts[parts.length - 1] || '', 10);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof request === 'object') {
    if (request.id != null) {
      const n = Number(request.id);
      if (Number.isFinite(n)) return n;
    }
    const iri = request['@id'];
    if (typeof iri === 'string') {
      const parts = iri.split('/');
      const n = parseInt(parts[parts.length - 1] || '', 10);
      return Number.isFinite(n) ? n : null;
    }
  }
  return null;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** YYYY-MM-DD en zona local. */
export function toLocalDateString(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** YYYY-MM-DDTHH:mm:ss en zona local (sin zona), para API / IonDatetime. */
export function toLocalDateTimeString(date: Date): string {
  return `${toLocalDateString(date)}T${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

/**
 * Extrae la hora civil (wall-clock) de un ISO, ignorando Z / offset.
 *
 * La fecha del trabajo es un día+hora locales (p. ej. "el martes a las 10:00"),
 * no un instante UTC. API Platform suele devolver lo guardado como
 * `…T10:00:00+00:00`; si se parsea con `new Date` en España se muestra 12:00
 * en el calendario mientras IonDatetime (que ignora la zona) sigue mostrando
 * 10:00. Por eso nunca convertimos por timezone al leer/escribir startsAt.
 */
export function toWallClockDateTimeString(value: string): string {
  const m = value.trim().match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/,
  );
  if (m) {
    return `${m[1]}-${m[2]}-${m[3]}T${m[4] ?? '00'}:${m[5] ?? '00'}:${pad2(Number(m[6] ?? 0))}`;
  }
  return toLocalDateTimeString(new Date());
}

/** Parsea startsAt como hora civil local (ignora sufijo de zona). */
export function parseStartsAt(value: string): Date {
  const wall = toWallClockDateTimeString(value);
  const m = wall.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/,
  );
  if (!m) return new Date(NaN);
  return new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Number(m[4]),
    Number(m[5]),
    Number(m[6]),
  );
}

/** Hora HH:mm para listados del calendario (misma base que el editor). */
export function formatStartsAtTime(value: string): string {
  return parseStartsAt(value).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** Fecha+hora corta para detalle del trabajo. */
export function formatStartsAtDateTime(value: string): string {
  return parseStartsAt(value).toLocaleString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function eventRecencyMs(ev: CalendarEvent): number {
  const stamp = ev.updatedAt || ev.createdAt || ev.startsAt;
  const t = stamp ? parseStartsAt(stamp).getTime() : 0;
  return Number.isFinite(t) ? t : 0;
}

/**
 * Un evento por request: si hay duplicados (bug histórico), nos quedamos
 * con el más reciente. Evita que el detalle edite una fecha y el calendario
 * muestre otra.
 */
export function dedupeCalendarEventsByRequest(
  events: CalendarEvent[],
): CalendarEvent[] {
  const best = new Map<number, CalendarEvent>();
  const orphans: CalendarEvent[] = [];

  for (const ev of events) {
    const reqId = calendarEventRequestId(ev.request);
    if (reqId == null) {
      orphans.push(ev);
      continue;
    }
    const prev = best.get(reqId);
    if (!prev) {
      best.set(reqId, ev);
      continue;
    }
    const newer =
      eventRecencyMs(ev) > eventRecencyMs(prev) ||
      (eventRecencyMs(ev) === eventRecencyMs(prev) && ev.id > prev.id);
    if (newer) best.set(reqId, ev);
  }

  return [...best.values(), ...orphans];
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
  return dedupeCalendarEventsByRequest(
    hydraMembers<CalendarEvent>(res.data),
  );
}

export async function getCalendarEventForRequest(
  requestId: number,
): Promise<CalendarEvent | null> {
  // listCalendarEvents ya deduplica; un solo resultado por request.
  const events = await listCalendarEvents({
    requestIri: requestIri(requestId),
  });
  return events[0] ?? null;
}

/**
 * Crea o actualiza la única fecha del trabajo para esa request.
 * Evita un segundo CalendarEvent si ya existía uno.
 */
export async function upsertCalendarEventForRequest(input: {
  requestId: number;
  startsAt: string;
  notes?: string | null;
  existingEventId?: number | null;
}): Promise<CalendarEvent> {
  const existingId =
    input.existingEventId ??
    (await getCalendarEventForRequest(input.requestId))?.id ??
    null;

  if (existingId != null) {
    return updateCalendarEvent(existingId, {
      startsAt: input.startsAt,
      notes: input.notes ?? null,
    });
  }

  return createCalendarEvent({
    requestId: input.requestId,
    startsAt: input.startsAt,
    notes: input.notes,
  });
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
