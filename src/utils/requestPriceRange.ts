import type { ServiceRequest } from '../types';

/**
 * Datos mínimos para mostrar u ordenar por rango de precio IA.
 *
 * Contrato:
 * - Backend/BD conserva los importes en céntimos (enteros).
 * - La UI trabaja en euros (con conversión /100).
 */
export type RequestPriceRangeInput = Pick<
  ServiceRequest,
  'estimatedPriceMin' | 'estimatedPriceMax' | 'aiDiagnosis' | 'pricingType'
>;

function resolvePricingType(r: RequestPriceRangeInput): string {
  const diag = r.aiDiagnosis as { pricing_type?: string; pricingType?: string } | undefined;
  const raw = r.pricingType ?? diag?.pricing_type ?? diag?.pricingType ?? '';
  return String(raw).toUpperCase();
}

/**
 * Obtiene min/max en euros (UI) a partir de min/max en céntimos (contrato backend).
 * Como fallback legacy, usa `aiDiagnosis.min/max` (también en céntimos).
 */
export function getRequestPriceRangeEuros(r: RequestPriceRangeInput): {
  min: number;
  max: number;
} | null {
  let minCents = r.estimatedPriceMin;
  let maxCents = r.estimatedPriceMax;
  const diag = r.aiDiagnosis as { min?: number; max?: number } | undefined;

  if (typeof minCents !== 'number' || !Number.isFinite(minCents)) {
    minCents = typeof diag?.min === 'number' ? diag.min : (NaN as number);
  }
  if (typeof maxCents !== 'number' || !Number.isFinite(maxCents)) {
    maxCents = typeof diag?.max === 'number' ? diag.max : (NaN as number);
  }
  if (!Number.isFinite(minCents) || !Number.isFinite(maxCents)) return null;

  const loCents = Math.min(minCents, maxCents);
  const hiCents = Math.max(minCents, maxCents);

  const minEuros = Math.max(0, Math.round(loCents / 100));
  const maxEuros = Math.max(minEuros, Math.round(hiCents / 100));
  return { min: minEuros, max: maxEuros };
}

/** Texto compacto para UI (listados, badges). */
export function formatRequestPriceRangeEuros(r: RequestPriceRangeInput): string {
  if (resolvePricingType(r) === 'VISIT_REQUIRED') {
    return 'Requiere visita de valoración';
  }

  const rng = getRequestPriceRangeEuros(r);
  if (!rng) return '—';
  return `${rng.min}€ - ${rng.max}€`;
}

/**
 * Valor inicial razonable para el input de propuesta del profesional.
 * La UI muestra euros, así que devolvemos euros (punto medio del rango en euros).
 */
export function suggestedBidPriceEuros(r: RequestPriceRangeInput): number | undefined {
  const rng = getRequestPriceRangeEuros(r);
  if (!rng) return undefined;
  return Math.round((rng.min + rng.max) / 2);
}
