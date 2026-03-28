import type { ApiError, ApiViolation } from '../types';

/** Códigos de negocio conocidos en POST /bids (API Platform). */
const BID_VIOLATION_CODE_PRIORITY = [
  'BID_HIGH_REQUIRES_PAID_SUBSCRIPTION',
  'BID_MONTHLY_LIMIT_EXCEEDED',
] as const;

function pickViolationMessage(violations: ApiViolation[] | undefined): string | undefined {
  if (!violations?.length) return undefined;
  for (const code of BID_VIOLATION_CODE_PRIORITY) {
    const v = violations.find((x) => x.code === code);
    if (v?.message) return v.message;
  }
  return violations[0]?.message;
}

/**
 * Extrae mensaje legible de axios/API Platform.
 * En 422 con varias violations, prioriza códigos de puja (riskLevel / monthlyBidLimit).
 */
export function getApiErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const resp = (error as { response?: { data?: ApiError } }).response;
    const data = resp?.data;
    if (data) {
      const fromViolations = pickViolationMessage(data.violations);
      return (
        fromViolations ??
        data['hydra:description'] ??
        data.message ??
        data.detail ??
        data.error ??
        'Error de conexión. Inténtalo de nuevo.'
      );
    }
  }
  if (error instanceof Error) return error.message;
  return 'Error desconocido. Inténtalo de nuevo.';
}
