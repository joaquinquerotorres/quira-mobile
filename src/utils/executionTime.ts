/** Valor del selector mientras se elige el día (aún no hay fecha). */
export const EXECUTION_TIME_SPECIFIC_OPTION = 'Fecha concreta';

const SPECIFIC_PREFIX = 'Fecha concreta:';

/** Opciones predefinidas del cliente (crear solicitud). */
export const CLIENT_EXECUTION_TIME_OPTIONS = [
  'Lo antes posible',
  'Esta semana',
  'La próxima semana',
  'A convenir al aceptar la oferta',
  EXECUTION_TIME_SPECIFIC_OPTION,
] as const;

/** Opciones predefinidas del profesional (propuesta). */
export const PRO_EXECUTION_TIME_OPTIONS = [
  'Hoy mismo',
  'Mañana',
  'Esta semana',
  'La próxima semana',
  'En dos semanas o más',
  'A convenir al aceptar la oferta',
  EXECUTION_TIME_SPECIFIC_OPTION,
] as const;

export function toLocalIsoDate(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Formato persistido / mostrado: "Fecha concreta: DD/MM/YYYY". */
export function formatSpecificExecutionTime(isoDate: string): string {
  const m = isoDate.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return EXECUTION_TIME_SPECIFIC_OPTION;
  return `${SPECIFIC_PREFIX} ${m[3]}/${m[2]}/${m[1]}`;
}

export function isSpecificExecutionTime(value: string | null | undefined): boolean {
  if (!value) return false;
  const v = value.trim();
  if (v === EXECUTION_TIME_SPECIFIC_OPTION) return true;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return true;
  return new RegExp(`^${SPECIFIC_PREFIX}\\s*\\d{1,2}/\\d{1,2}/\\d{4}$`, 'i').test(v);
}

/** YYYY-MM-DD para IonDatetime, o null si aún no hay día. */
export function parseSpecificExecutionIso(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const v = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = v.match(
    new RegExp(`^${SPECIFIC_PREFIX}\\s*(\\d{1,2})/(\\d{1,2})/(\\d{4})$`, 'i'),
  );
  if (!m) return null;
  const pad = (n: string) => n.padStart(2, '0');
  return `${m[3]}-${pad(m[2])}-${pad(m[1])}`;
}

/** Valor del IonSelect a partir del string persistido. */
export function executionTimeSelectValue(value: string | null | undefined): string {
  if (!value) return '';
  if (isSpecificExecutionTime(value)) return EXECUTION_TIME_SPECIFIC_OPTION;
  return value;
}

/** true si hay un valor usable para enviar (preset o fecha concreta completa). */
export function isExecutionTimeComplete(value: string | null | undefined): boolean {
  if (!value?.trim()) return false;
  if (value.trim() === EXECUTION_TIME_SPECIFIC_OPTION) return false;
  if (isSpecificExecutionTime(value)) {
    return parseSpecificExecutionIso(value) != null;
  }
  return true;
}
