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

const SPANISH_MONTHS: Record<string, number> = {
  enero: 1,
  ene: 1,
  febrero: 2,
  feb: 2,
  marzo: 3,
  mar: 3,
  abril: 4,
  abr: 4,
  mayo: 5,
  may: 5,
  junio: 6,
  jun: 6,
  julio: 7,
  jul: 7,
  agosto: 8,
  ago: 8,
  septiembre: 9,
  setiembre: 9,
  sep: 9,
  sept: 9,
  octubre: 10,
  oct: 10,
  noviembre: 11,
  nov: 11,
  diciembre: 12,
  dic: 12,
};

function isValidCivilDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
}

function toIsoIfValid(year: number, month: number, day: number): string | null {
  if (!isValidCivilDate(year, month, day)) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}`;
}

/**
 * Extrae YYYY-MM-DD de `schedule_intent` de /predict (texto libre o ISO).
 * Devuelve null si no hay una fecha concreta reconocible.
 */
export function parseScheduleIntentToIso(
  intent: string | null | undefined,
  today: Date = new Date(),
): string | null {
  if (!intent || typeof intent !== 'string') return null;
  const raw = intent.trim();
  if (!raw) return null;

  const iso = raw.match(/(?:^|\D)(\d{4})-(\d{2})-(\d{2})(?:\D|$)/);
  if (iso) {
    return toIsoIfValid(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }

  const dmy = raw.match(
    /(?:^|\D)(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})(?:\D|$)/,
  );
  if (dmy) {
    return toIsoIfValid(Number(dmy[3]), Number(dmy[2]), Number(dmy[1]));
  }

  const monthNames = Object.keys(SPANISH_MONTHS).join('|');
  const es = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .match(
      new RegExp(
        `(?:^|\\b)(?:el\\s+)?(\\d{1,2})\\s+de\\s+(${monthNames})(?:\\s+de\\s+(\\d{4}))?\\b`,
      ),
    );
  if (es) {
    const day = Number(es[1]);
    const month = SPANISH_MONTHS[es[2]];
    let year = es[3] ? Number(es[3]) : today.getFullYear();
    if (!es[3]) {
      const candidate = new Date(year, month - 1, day);
      const startOfToday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
      if (candidate < startOfToday) year += 1;
    }
    return toIsoIfValid(year, month, day);
  }

  return null;
}
