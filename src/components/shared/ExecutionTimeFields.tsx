import React, { useId } from 'react';
import {
  IonDatetime,
  IonDatetimeButton,
  IonLabel,
  IonModal,
  IonSelect,
  IonSelectOption,
} from '@ionic/react';
import {
  EXECUTION_TIME_SPECIFIC_OPTION,
  executionTimeSelectValue,
  formatSpecificExecutionTime,
  isSpecificExecutionTime,
  parseSpecificExecutionIso,
  toLocalIsoDate,
} from '../../utils/executionTime';
import './ExecutionTimeFields.css';

export interface ExecutionTimeFieldsProps {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  /** Clase del wrapper del select (p.ej. bid-input-group / input-wrapper). */
  className?: string;
  selectWrapClassName?: string;
}

/**
 * Selector de disponibilidad/preferencia + opción «Fecha concreta»
 * que revela un date picker (sin quitar las opciones predefinidas).
 */
export const ExecutionTimeFields: React.FC<ExecutionTimeFieldsProps> = ({
  label,
  options,
  value,
  onChange,
  className,
  selectWrapClassName = 'input-wrapper',
}) => {
  const datetimeId = useId().replace(/:/g, '');
  const pickerId = `execution-time-date-${datetimeId}`;
  const selectValue = executionTimeSelectValue(value);
  const showDatePicker = isSpecificExecutionTime(value) || selectValue === EXECUTION_TIME_SPECIFIC_OPTION;
  const dateIso = parseSpecificExecutionIso(value) ?? toLocalIsoDate();
  const minDate = toLocalIsoDate();

  const handleSelect = (next: string) => {
    if (next === EXECUTION_TIME_SPECIFIC_OPTION) {
      // Mantener día previo si ya había fecha concreta; si no, pedir elegir.
      const existing = parseSpecificExecutionIso(value);
      onChange(
        existing
          ? formatSpecificExecutionTime(existing)
          : EXECUTION_TIME_SPECIFIC_OPTION,
      );
      return;
    }
    onChange(next);
  };

  const handleDateChange = (raw: string | string[] | null | undefined) => {
    const v = Array.isArray(raw) ? raw[0] : raw;
    if (!v) return;
    // IonDatetime puede emitir con hora; nos quedamos con la fecha civil.
    const iso = v.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return;
    onChange(formatSpecificExecutionTime(iso));
  };

  return (
    <div className={className}>
      {label ? (
        <IonLabel className="section-label execution-time-label">{label}</IonLabel>
      ) : null}
      <div className={selectWrapClassName}>
        <IonSelect
          interface="action-sheet"
          placeholder="Selecciona una opción"
          value={selectValue || undefined}
          onIonChange={(e) => handleSelect(String(e.detail.value ?? ''))}
        >
          {options.map((opt) => (
            <IonSelectOption key={opt} value={opt}>
              {opt}
            </IonSelectOption>
          ))}
        </IonSelect>
      </div>

      {showDatePicker && (
        <div className="execution-time-date-block">
          <div className="execution-time-date-hint">Elige el día</div>
          <div className="execution-time-date-row">
            <IonDatetimeButton datetime={pickerId} />
          </div>
          <IonModal keepContentsMounted={true}>
            <IonDatetime
              id={pickerId}
              presentation="date"
              preferWheel={false}
              value={
                value === EXECUTION_TIME_SPECIFIC_OPTION ? minDate : dateIso
              }
              min={minDate}
              locale="es-ES"
              showDefaultButtons={true}
              doneText="Elegir"
              cancelText="Cancelar"
              onIonChange={(e) => handleDateChange(e.detail.value)}
            />
          </IonModal>
        </div>
      )}
    </div>
  );
};
