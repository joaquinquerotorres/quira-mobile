import React, { useCallback, useMemo, useState } from 'react';
import {
  IonAlert,
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonToast,
  IonToolbar,
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
import CalendarEventFormModal from '../components/calendar/CalendarEventFormModal';
import type { CalendarEvent, ServiceRequest } from '../types';
import {
  deleteCalendarEvent,
  listCalendarEvents,
  listWonJobs,
  parseStartsAt,
  toLocalDateString,
} from '../api/calendarEventsApi';
import { TOAST_DURATION_MS } from '../config/uiTiming';
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

function formatEventTime(value: string): string {
  return parseStartsAt(value).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const from = startOfMonth(cursor);
      const to = endOfMonth(cursor);
      const [monthEvents, allEvents, wonJobs] = await Promise.all([
        listCalendarEvents({
          startsAtAfter: toLocalDateString(from),
          startsAtBefore: `${toLocalDateString(to)}T23:59:59`,
        }),
        listCalendarEvents(),
        listWonJobs(),
      ]);
      setEvents(monthEvents);
      setScheduledRequestIds(new Set(allEvents.map((e) => e.request.id)));
      setJobs(wonJobs);
    } catch {
      setToast('No se pudo cargar el calendario.');
    } finally {
      setLoading(false);
    }
  }, [cursor]);

  useIonViewWillEnter(() => {
    load();
  });

  React.useEffect(() => {
    load();
  }, [load]);

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

  const openCreate = () => {
    if (availableJobs.length === 0) {
      setToast('No tienes trabajos ganados pendientes de agendar.');
      return;
    }
    setFormMode('create');
    setEditingEvent(null);
    setShowForm(true);
  };

  const openEdit = (ev: CalendarEvent) => {
    setFormMode('edit');
    setEditingEvent(ev);
    setShowForm(true);
  };

  return (
    <IonPage>
      <LogoHeader />
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': '#f8fafc' }}>
          <div className="pro-calendar-title">Calendario</div>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': '#f8fafc' }}>
        <IonRefresher
          slot="fixed"
          onIonRefresh={async (e) => {
            await load();
            e.detail.complete();
          }}
        >
          <IonRefresherContent />
        </IonRefresher>

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
                      onClick={() =>
                        router.push(`/pro/request/${ev.request.id}`, 'forward')
                      }
                    >
                      <div className="pro-calendar-event-time">
                        {formatEventTime(ev.startsAt)}
                      </div>
                      <div className="pro-calendar-event-title">
                        {ev.request.title}
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
              formMode === 'edit' ? 'Evento actualizado.' : 'Trabajo agendado.',
            );
            load();
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
                  load();
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
