/**
 * Parseo de flags de seguridad / alcance en la respuesta de POST /predict.
 * safe ≠ in_scope: ver docs API / BACKEND_PREDICT_UPLOAD.
 */

export type PredictSafetyFields = {
  safe: boolean;
  safetyReason: string | null;
  inScope: boolean;
  outOfScopeReason: string | null;
};

const DEFAULT_OUT_OF_SCOPE_MESSAGE =
  'Esto no parece un servicio que Quira cubra ahora mismo.';

const DEFAULT_UNSAFE_MESSAGE =
  'Tu solicitud puede quedar en revisión. No publiques teléfonos, emails ni redes de contacto en la descripción.';

/** Boolean JSON / string; si el campo no viene, usa `defaultWhenAbsent`. */
export function parsePredictOptionalBoolean(
  raw: unknown,
  defaultWhenAbsent: boolean,
): boolean {
  if (raw === undefined || raw === null || raw === '') {
    return defaultWhenAbsent;
  }
  if (typeof raw === 'boolean') return raw;
  const s = String(raw).trim().toLowerCase();
  if (s === 'true') return true;
  if (s === 'false') return false;
  return defaultWhenAbsent;
}

function parseOptionalReason(...candidates: unknown[]): string | null {
  for (const raw of candidates) {
    if (typeof raw === 'string' && raw.trim() !== '') {
      return raw.trim();
    }
  }
  return null;
}

/**
 * Extrae safe / in_scope (y motivos) del resultado de predict.
 * - `safe` ausente → false (mismo criterio conservador que NewRequest histórico).
 * - `in_scope` ausente → true (compat API antigua).
 */
export function parsePredictSafetyFields(
  aiData: Record<string, unknown>,
): PredictSafetyFields {
  const safeFlagRaw = aiData.safe ?? aiData.is_safe;
  const safe =
    typeof safeFlagRaw === 'boolean'
      ? safeFlagRaw
      : String(safeFlagRaw ?? '').toLowerCase() === 'true';

  const safetyReason = parseOptionalReason(
    aiData.safety_reason,
    aiData.safetyReason,
    aiData.reason,
  );

  const inScopeRaw = aiData.in_scope ?? aiData.inScope;
  const inScope = parsePredictOptionalBoolean(inScopeRaw, true);

  const outOfScopeReason = parseOptionalReason(
    aiData.out_of_scope_reason,
    aiData.outOfScopeReason,
  );

  return { safe, safetyReason, inScope, outOfScopeReason };
}

export function outOfScopeUserMessage(reason: string | null): string {
  return reason?.trim() || DEFAULT_OUT_OF_SCOPE_MESSAGE;
}

export function unsafeUserMessage(reason: string | null): string {
  if (reason?.trim()) {
    return `${reason.trim()} Tu solicitud puede quedar en revisión; evita datos de contacto.`;
  }
  return DEFAULT_UNSAFE_MESSAGE;
}
