import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonDatetimeButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import type { CalendarEvent, ServiceRequest } from '../../types';
import {
  createCalendarEvent,
  parseStartsAt,
  toLocalDateTimeString,
  updateCalendarEvent,
} from '../../api/calendarEventsApi';

export type CalendarEventFormMode = 'create' | 'edit';

interface CalendarEventFormModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
  mode: CalendarEventFormMode;
  availableJobs?: ServiceRequest[];
  lockedRequest?: ServiceRequest | null;
  event?: CalendarEvent | null;
  onSaved: (event: CalendarEvent) => void;
  onError?: (message: string) => void;
}

const DATETIME_PICKER_ID = 'calendar-event-starts-at';

function defaultStartsAt(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  if (d.getHours() < 8) d.setHours(9);
  return toLocalDateTimeString(d);
}

const CalendarEventFormModal: React.FC<CalendarEventFormModalProps> = ({
  isOpen,
  onDidDismiss,
  mode,
  availableJobs = [],
  lockedRequest = null,
  event = null,
  onSaved,
  onError,
}) => {
  const [requestId, setRequestId] = useState<number | null>(null);
  const [startsAt, setStartsAt] = useState(defaultStartsAt);
  const [saving, setSaving] = useState(false);
  const datetimeRef = useRef<HTMLIonDatetimeElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && event) {
      setRequestId(event.request.id);
      setStartsAt(toLocalDateTimeString(parseStartsAt(event.startsAt)));
      return;
    }
    setRequestId(lockedRequest?.id ?? null);
    setStartsAt(defaultStartsAt());
  }, [isOpen, mode, event, lockedRequest]);

  const title = mode === 'edit' ? 'Editar en calendario' : 'Añadir al calendario';

  const canSave = useMemo(
    () => !!requestId && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(startsAt),
    [requestId, startsAt],
  );

  const handleDateTimeChange = (value: string | string[] | null | undefined) => {
    const v = Array.isArray(value) ? value[0] : value;
    if (!v) return;
    setStartsAt(toLocalDateTimeString(parseStartsAt(v)));
  };

  const handleSave = async () => {
    if (!canSave || requestId == null) return;
    setSaving(true);
    try {
      if (mode === 'edit' && event) {
        const updated = await updateCalendarEvent(event.id, { startsAt });
        onSaved(updated);
      } else {
        const created = await createCalendarEvent({ requestId, startsAt });
        onSaved(created);
      }
      onDidDismiss();
    } catch (e: any) {
      const msg =
        e?.response?.data?.['hydra:description'] ||
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        'No se pudo guardar el evento.';
      onError?.(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <IonModal
        isOpen={isOpen}
        onDidDismiss={onDidDismiss}
        initialBreakpoint={0.65}
        breakpoints={[0, 0.65, 0.85]}
      >
        <IonHeader className="ion-no-border">
          <IonToolbar>
            <IonTitle style={{ fontWeight: 800 }}>{title}</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={onDidDismiss} color="medium">
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          {mode === 'create' && !lockedRequest && (
            <IonItem lines="full" className="calendar-form-item">
              <IonLabel position="stacked">Trabajo ganado</IonLabel>
              <IonSelect
                interface="action-sheet"
                placeholder="Selecciona un trabajo"
                value={requestId ?? undefined}
                onIonChange={(e) => setRequestId(Number(e.detail.value))}
              >
                {availableJobs.map((job) => (
                  <IonSelectOption key={job.id} value={job.id}>
                    {job.title}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
          )}

          {(lockedRequest || (mode === 'edit' && event)) && (
            <div className="calendar-form-locked-title">
              {lockedRequest?.title || event?.request.title}
            </div>
          )}

          <div className="calendar-form-label">Comienzo</div>
          <div className="calendar-form-date-row">
            <IonDatetimeButton datetime={DATETIME_PICKER_ID} />
          </div>
          <p className="calendar-form-hint">
            Fecha y hora de inicio. No hace falta indicar cuándo termina.
          </p>

          <IonButton
            expand="block"
            className="quira-main-btn"
            style={{ marginTop: 24 }}
            disabled={!canSave || saving}
            onClick={handleSave}
          >
            {saving ? <IonSpinner name="crescent" /> : 'GUARDAR'}
          </IonButton>
        </IonContent>
      </IonModal>

      <IonModal keepContentsMounted={true}>
        <IonDatetime
          id={DATETIME_PICKER_ID}
          ref={datetimeRef}
          presentation="date-time"
          preferWheel={false}
          value={startsAt}
          onIonChange={(e) => handleDateTimeChange(e.detail.value)}
          locale="es-ES"
          hourCycle="h23"
          minuteValues="0,15,30,45"
          showDefaultButtons={true}
          doneText="Elegir"
          cancelText="Cancelar"
        />
      </IonModal>
    </>
  );
};

export default CalendarEventFormModal;
