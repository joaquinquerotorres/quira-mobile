import type { ServiceRequest } from '../types';

/** Datos mínimos para mostrar u ordenar por rango de precio IA (euros). */
export type RequestPriceRangeInput = Pick<
  ServiceRequest,
  'estimatedPriceMin' | 'estimatedPriceMax' | 'aiDiagnosis'
>;

/**
 * Obtiene min/max en euros desde la API o, en último recurso, desde `aiDiagnosis` (legacy).
 */
export function getRequestPriceRangeEuros(r: RequestPriceRangeInput): {
  min: number;
  max: number;
} | null {
  let min = r.estimatedPriceMin;
  let max = r.estimatedPriceMax;
  const diag = r.aiDiagnosis as { min?: number; max?: number } | undefined;
  if (typeof min !== 'number' || !Number.isFinite(min)) {
    min = typeof diag?.min === 'number' ? diag.min : (NaN as number);
  }
  if (typeof max !== 'number' || !Number.isFinite(max)) {
    max = typeof diag?.max === 'number' ? diag.max : (NaN as number);
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return { min: lo, max: hi };
}

/** Texto compacto para UI (listados, badges). */
export function formatRequestPriceRangeEuros(r: RequestPriceRangeInput): string {
  const rng = getRequestPriceRangeEuros(r);
  if (!rng) return '—';
  return `${rng.min}€ - ${rng.max}€`;
}

/** Valor inicial razonable para el input de propuesta del profesional (punto medio del rango). */
export function suggestedBidPriceEuros(r: RequestPriceRangeInput): number | undefined {
  const rng = getRequestPriceRangeEuros(r);
  if (!rng) return undefined;
  return Math.round((rng.min + rng.max) / 2);
}
