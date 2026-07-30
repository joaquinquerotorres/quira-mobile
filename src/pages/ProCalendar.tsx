import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  IonAlert,
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonToast,
  useIonRouter,
  useIonViewWillEnter,
} from '@ionic/react';
import {
  addOutline,
  chevronBackOutline,
  chevronForwardOutline,
  createOutline,
  trashOutline,
} from 'ionicons/icons';
import { LogoHeader } from '../components/layout/LogoHeader';
import MainHeader from '../components/shared/MainHeader';
import CalendarEventFormModal from '../components/calendar/CalendarEventFormModal';
import type { CalendarEvent, ServiceRequest } from '../types';
import {
  calendarEventRequestId,
  deleteCalendarEvent,
  listCalendarEvents,
  listWonJobs,
  formatStartsAtTime,
  parseStartsAt,
  toLocalDateString,
} from '../api/calendarEventsApi';
import { TOAST_DURATION_MS } from '../config/uiTiming';
import {
  LIST_FETCH_STALE_MS,
  createFetchFreshness,
} from '../utils/fetchFreshness';
import './ProCalendar.css';

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatMonthTitle(d: Date): string {
  return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}

const ProCalendar: React.FC = () => {
  const router = useIonRouter();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [scheduledRequestIds, setScheduledRequestIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [jobs, setJobs] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null);

  const monthFreshness = useRef(createFetchFreshness(LIST_FETCH_STALE_MS)).current;
  const createDataFreshness = useRef(createFetchFreshness(LIST_FETCH_STALE_MS)).current;
  const createDataCache = useRef<{
    jobs: ServiceRequest[];
    scheduledIds: Set<number>;
  } | null>(null);
  const skipCursorEffectOnce = useRef(true);

  const monthKey = `${cursor.getFullYear()}-${cursor.getMonth()}`;

  /** Solo eventos del mes visible (vista calendario). */
  const loadMonth = useCallback(
    async (opts?: { force?: boolean }) => {
      if (monthFreshness.shouldSkip(monthKey, opts)) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const from = startOfMonth(cursor);
        const to = endOfMonth(cursor);
        const monthEvents = await listCalendarEvents({
          startsAtAfter: toLocalDateString(from),
          startsAtBefore: `${toLocalDateString(to)}T23:59:59`,
        });
        setEvents(monthEvents);
        monthFreshness.mark(monthKey);
      } catch {
        setToast('No se pudo cargar el calendario.');
      } finally {
        setLoading(false);
      }
    },
    [cursor, monthKey, monthFreshness],
  );

  /**
   * Jobs ganados + ids ya agendados: solo al abrir “crear” o en pull-to-refresh.
   * Evita GET unbounded de calendar_events + my_jobs en cada entrada al mes.
   */
  const loadCreateData = useCallback(async (opts?: { force?: boolean }) => {
    if (
      createDataCache.current &&
      createDataFreshness.shouldSkip('create', opts)
    ) {
      return createDataCache.current;
    }
    const [allEvents, wonJobs] = await Promise.all([
      listCalendarEvents(),
      listWonJobs(),
    ]);
    const scheduledIds = new Set(
      allEvents
        .map((e) => calendarEventRequestId(e.request))
        .filter((id): id is number => id != null),
    );
    const payload = { jobs: wonJobs, scheduledIds };
    createDataCache.current = payload;
    setJobs(wonJobs);
    setScheduledRequestIds(scheduledIds);
    createDataFreshness.mark('create');
    return payload;
  }, [createDataFreshness]);

  const loadAll = useCallback(
    async (opts?: { force?: boolean }) => {
      await Promise.all([loadMonth(opts), loadCreateData(opts)]);
    },
    [loadMonth, loadCreateData],
  );

  useIonViewWillEnter(() => {
    void loadMonth({ force: false });
  });

  // Cambio de mes: siempre. Skip 1ª vez (willEnter ya carga el mes actual).
  useEffect(() => {
    if (skipCursorEffectOnce.current) {
      skipCursorEffectOnce.current = false;
      return;
    }
    void loadMonth({ force: true });
  }, [monthKey, loadMonth]);

  const availableJobs = useMemo(
    () => jobs.filter((j) => !scheduledRequestIds.has(j.id)),
    [jobs, scheduledRequestIds],
  );

  const daysGrid = useMemo(() => {
    const first = startOfMonth(cursor);
    // Monday-based: JS getDay() Sun=0 → shift
    const startPad = (first.getDay() + 6) % 7;
    const daysInMonth = endOfMonth(cursor).getDate();
    const cells: Array<{ date: Date | null; key: string }> = [];
    for (let i = 0; i < startPad; i++) {
      cells.push({ date: null, key: `pad-${i}` });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(cursor.getFullYear(), cursor.getMonth(), day);
      cells.push({ date, key: `d-${day}` });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ date: null, key: `pad-end-${cells.length}` });
    }
    return cells;
  }, [cursor]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const d = parseStartsAt(ev.startsAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const list = map.get(key) || [];
      list.push(ev);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort(
        (a, b) =>
          parseStartsAt(a.startsAt).getTime() -
          parseStartsAt(b.startsAt).getTime(),
      );
    }
    return map;
  }, [events]);

  const dayKey = (d: Date) =>
    `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  const selectedEvents = eventsByDay.get(dayKey(selectedDay)) || [];

  const openCreate = async () => {
    try {
      const { jobs: wonJobs, scheduledIds } = await loadCreateData({
        force: false,
      });
      const available = wonJobs.filter((j) => !scheduledIds.has(j.id));
      if (available.length === 0) {
        setToast('No tienes trabajos ganados pendientes de agendar.');
        return;
      }
      setFormMode('create');
      setEditingEvent(null);
      setShowForm(true);
    } catch {
      setToast('No se pudo cargar trabajos para agendar.');
    }
  };

  const openEdit = (ev: CalendarEvent) => {
    setFormMode('edit');
    setEditingEvent(ev);
    setShowForm(true);
  };

  return (
    <IonPage>
      <LogoHeader />

      <IonContent fullscreen style={{ '--background': '#f8fafc' }}>
        <IonRefresher
          slot="fixed"
          onIonRefresh={async (e) => {
            monthFreshness.invalidate();
            createDataFreshness.invalidate();
            createDataCache.current = null;
            await loadAll({ force: true });
            e.detail.complete();
          }}
        >
          <IonRefresherContent />
        </IonRefresher>

        <MainHeader
          title="Calendario"
          subtitle="Organiza tus trabajos agendados."
        />

        <div className="pro-calendar-content">
        <div className="pro-calendar-month-nav">
          <IonButton
            fill="clear"
            onClick={() =>
              setCursor(
                new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1),
              )
            }
          >
            <IonIcon icon={chevronBackOutline} />
          </IonButton>
          <div className="pro-calendar-month-label">
            {formatMonthTitle(cursor)}
          </div>
          <IonButton
            fill="clear"
            onClick={() =>
              setCursor(
                new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1),
              )
            }
          >
            <IonIcon icon={chevronForwardOutline} />
          </IonButton>
        </div>

        {loading ? (
          <div className="pro-calendar-loading">
            <IonSpinner name="crescent" />
          </div>
        ) : (
          <>
            <div className="pro-calendar-grid">
              {WEEKDAYS.map((w) => (
                <div key={w} className="pro-calendar-weekday">
                  {w}
                </div>
              ))}
              {daysGrid.map((cell) => {
                if (!cell.date) {
                  return <div key={cell.key} className="pro-calendar-cell empty" />;
                }
                const key = dayKey(cell.date);
                const dayEvents = eventsByDay.get(key) || [];
                const selected = sameDay(cell.date, selectedDay);
                const isToday = sameDay(cell.date, new Date());
                return (
                  <button
                    key={cell.key}
                    type="button"
                    className={`pro-calendar-cell${selected ? ' selected' : ''}${isToday ? ' today' : ''}`}
                    onClick={() => setSelectedDay(cell.date!)}
                  >
                    <span className="pro-calendar-day-num">
                      {cell.date.getDate()}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="pro-calendar-dots">
                        {dayEvents.slice(0, 3).map((ev) => (
                          <span key={ev.id} className="pro-calendar-dot" />
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pro-calendar-day-panel">
              <div className="pro-calendar-day-heading">
                {selectedDay.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </div>
              {selectedEvents.length === 0 ? (
                <div className="pro-calendar-empty">
                  Sin trabajos este día. Usa + para agendar.
                </div>
              ) : (
                selectedEvents.map((ev) => (
                  <div key={ev.id} className="pro-calendar-event-card">
                    <button
                      type="button"
                      className="pro-calendar-event-main"
                      onClick={() => {
                        const reqId = calendarEventRequestId(ev.request);
                        if (reqId != null) {
                          router.push(`/pro/request/${reqId}`, 'forward');
                        }
                      }}
                    >
                      <div className="pro-calendar-event-time">
                        {formatStartsAtTime(ev.startsAt)}
                      </div>
                      <div className="pro-calendar-event-title">
                        {typeof ev.request === 'object' && ev.request?.title
                          ? ev.request.title
                          : 'Trabajo'}
                      </div>
                    </button>
                    <div className="pro-calendar-event-actions">
                      <IonButton
                        fill="clear"
                        size="small"
                        onClick={() => openEdit(ev)}
                      >
                        <IonIcon icon={createOutline} />
                      </IonButton>
                      <IonButton
                        fill="clear"
                        size="small"
                        color="danger"
                        onClick={() => setDeleteTarget(ev)}
                      >
                        <IonIcon icon={trashOutline} />
                      </IonButton>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
        </div>

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={openCreate} className="pro-calendar-fab">
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>

        <CalendarEventFormModal
          isOpen={showForm}
          onDidDismiss={() => setShowForm(false)}
          mode={formMode}
          availableJobs={availableJobs}
          event={editingEvent}
          onSaved={() => {
            setToast(
              formMode === 'edit'
                ? 'Fecha del trabajo actualizada.'
                : 'Trabajo agendado.',
            );
            monthFreshness.invalidate();
            createDataFreshness.invalidate();
            createDataCache.current = null;
            void loadAll({ force: true });
          }}
          onError={(msg) => setToast(msg)}
        />

        <IonAlert
          isOpen={!!deleteTarget}
          header="Eliminar del calendario"
          message="¿Quitar este trabajo del calendario? El trabajo en Quira no se cancela."
          buttons={[
            { text: 'Cancelar', role: 'cancel', handler: () => setDeleteTarget(null) },
            {
              text: 'Eliminar',
              role: 'destructive',
              handler: async () => {
                if (!deleteTarget) return;
                try {
                  await deleteCalendarEvent(deleteTarget.id);
                  setToast('Evento eliminado.');
                  setDeleteTarget(null);
                  monthFreshness.invalidate();
                  createDataFreshness.invalidate();
                  createDataCache.current = null;
                  void loadAll({ force: true });
                } catch {
                  setToast('No se pudo eliminar el evento.');
                }
              },
            },
          ]}
          onDidDismiss={() => setDeleteTarget(null)}
        />

        <IonToast
          isOpen={!!toast}
          message={toast || ''}
          duration={TOAST_DURATION_MS}
          onDidDismiss={() => setToast(null)}
        />
      </IonContent>
    </IonPage>
  );
};

export default ProCalendar;
