import { describe, expect, it } from 'vitest';
import {
  calendarEventRequestId,
  dedupeCalendarEventsByRequest,
  parseStartsAt,
  toLocalDateTimeString,
} from './calendarEventsApi';
import type { CalendarEvent } from '../types';

function ev(
  partial: Partial<CalendarEvent> &
    Pick<CalendarEvent, 'id' | 'startsAt'> & {
      request: CalendarEvent['request'] | string;
    },
): CalendarEvent {
  return {
    notes: null,
    ...partial,
    request: partial.request as CalendarEvent['request'],
  };
}

describe('calendarEventRequestId', () => {
  it('reads numeric id, @id IRI and bare IRI string', () => {
    expect(calendarEventRequestId({ id: 7, title: 'x', status: 'ACCEPTED' })).toBe(
      7,
    );
    expect(
      calendarEventRequestId({
        '@id': '/api/requests/12',
        title: 'x',
        status: 'ACCEPTED',
      } as CalendarEvent['request']),
    ).toBe(12);
    expect(calendarEventRequestId('/api/requests/99')).toBe(99);
    expect(calendarEventRequestId(null)).toBeNull();
  });
});

describe('dedupeCalendarEventsByRequest', () => {
  it('keeps the most recently updated event per request', () => {
    const older = ev({
      id: 1,
      startsAt: '2026-08-10T09:00:00',
      updatedAt: '2026-08-01T10:00:00',
      request: { id: 5, title: 'Grifo', status: 'ACCEPTED' },
    });
    const newer = ev({
      id: 2,
      startsAt: '2026-08-20T11:00:00',
      updatedAt: '2026-08-15T10:00:00',
      request: { id: 5, title: 'Grifo', status: 'ACCEPTED' },
    });
    const other = ev({
      id: 3,
      startsAt: '2026-08-12T08:00:00',
      request: { id: 8, title: 'Pintura', status: 'ACCEPTED' },
    });

    const result = dedupeCalendarEventsByRequest([older, newer, other]);
    expect(result).toHaveLength(2);
    expect(result.find((e) => calendarEventRequestId(e.request) === 5)?.id).toBe(
      2,
    );
    expect(result.find((e) => calendarEventRequestId(e.request) === 5)?.startsAt).toBe(
      '2026-08-20T11:00:00',
    );
    expect(result.find((e) => calendarEventRequestId(e.request) === 8)?.id).toBe(
      3,
    );
  });

  it('resolves request id from IRI when id is missing', () => {
    const a = ev({
      id: 1,
      startsAt: '2026-08-10T09:00:00',
      updatedAt: '2026-08-01T10:00:00',
      request: { '@id': '/api/requests/5', title: 'A', status: 'ACCEPTED' } as CalendarEvent['request'],
    });
    const b = ev({
      id: 2,
      startsAt: '2026-08-22T09:00:00',
      updatedAt: '2026-08-20T10:00:00',
      request: '/api/requests/5' as unknown as CalendarEvent['request'],
    });
    const result = dedupeCalendarEventsByRequest([a, b]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });
});

describe('parseStartsAt / toLocalDateTimeString round-trip local', () => {
  it('keeps local wall time without timezone suffix', () => {
    const raw = '2026-08-20T10:30:00';
    const d = parseStartsAt(raw);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(7);
    expect(d.getDate()).toBe(20);
    expect(d.getHours()).toBe(10);
    expect(d.getMinutes()).toBe(30);
    expect(toLocalDateTimeString(d)).toBe(raw);
  });
});
