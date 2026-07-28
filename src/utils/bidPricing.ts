import type { ServiceRequest } from '../types';

export type BidPricingType = 'FIXED' | 'RANGE';
export type RequestPricingType = 'FIXED' | 'RANGE' | 'VISIT_REQUIRED';

/**
 * Reglas alineadas con `BidProfessionalProcessor` (backend):
 * - FIXED → solo puja FIXED
 * - RANGE → solo puja RANGE
 * - VISIT_REQUIRED / null → FIXED o RANGE
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

export function getAllowedBidPricingTypes(
  request:
    | Pick<ServiceRequest, 'pricingType' | 'aiDiagnosis'>
    | null
    | undefined,
): BidPricingType[] {
  const requestPricingType = getRequestPricingType(request);
  switch (requestPricingType) {
    case 'FIXED':
      return ['FIXED'];
    case 'RANGE':
      return ['RANGE'];
    case 'VISIT_REQUIRED':
    default:
      return ['FIXED', 'RANGE'];
  }
}

export function defaultBidPricingType(
  request:
    | Pick<ServiceRequest, 'pricingType' | 'aiDiagnosis'>
    | null
    | undefined,
): BidPricingType {
  return getAllowedBidPricingTypes(request)[0] ?? 'FIXED';
}
