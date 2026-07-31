import type { ServiceRequest } from '../types';

export type BidPricingType = 'FIXED' | 'RANGE';
export type RequestPricingType = 'FIXED' | 'RANGE' | 'VISIT_REQUIRED';

/**
 * Tipo de precio estimado por la IA / request (no limita ya la puja del pro).
 */
export function getRequestPricingType(
  request:
    | Pick<ServiceRequest, 'pricingType' | 'aiDiagnosis'>
    | null
    | undefined,
): RequestPricingType | '' {
  const diag = request?.aiDiagnosis as
    | { pricing_type?: string; pricingType?: string }
    | undefined;
  const raw =
    request?.pricingType ?? diag?.pricing_type ?? diag?.pricingType ?? '';
  const normalized = String(raw).toUpperCase().trim();
  if (
    normalized === 'FIXED' ||
    normalized === 'RANGE' ||
    normalized === 'VISIT_REQUIRED'
  ) {
    return normalized;
  }
  return '';
}

/**
 * El profesional puede elegir siempre FIXED o RANGE al pujar,
 * con independencia del pricingType de la solicitud (estimación IA).
 */
export function getAllowedBidPricingTypes(
  _request?:
    | Pick<ServiceRequest, 'pricingType' | 'aiDiagnosis'>
    | null
    | undefined,
): BidPricingType[] {
  return ['FIXED', 'RANGE'];
}

/** Prefiere el tipo de la estimación IA como valor inicial del selector. */
export function defaultBidPricingType(
  request:
    | Pick<ServiceRequest, 'pricingType' | 'aiDiagnosis'>
    | null
    | undefined,
): BidPricingType {
  return getRequestPricingType(request) === 'RANGE' ? 'RANGE' : 'FIXED';
}

/** Comentario obligatorio si la puja es por rango (explicar la horquilla). */
export function isBidCommentRequired(pricingType: BidPricingType): boolean {
  return pricingType === 'RANGE';
}

export function bidCommentLabel(pricingType: BidPricingType): string {
  return isBidCommentRequired(pricingType)
    ? 'Motivo del rango (obligatorio)'
    : 'Detalle de la propuesta (opcional)';
}

export function bidCommentPlaceholder(pricingType: BidPricingType): string {
  return isBidCommentRequired(pricingType)
    ? 'Indica por qué el precio no es fijo: materiales, acceso, estado desconocido, imprevistos…'
    : 'Cuéntale al cliente por qué eres el profesional ideal…';
}
