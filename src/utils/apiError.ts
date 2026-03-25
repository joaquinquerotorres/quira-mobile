import type { ApiError } from '../types';

/** Extrae mensaje de error legible de una respuesta API o Error */
export function getApiErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const resp = (error as { response?: { data?: ApiError } }).response;
    const data = resp?.data;
    if (data) {
      return (
        data['hydra:description'] ??
        data.message ??
        data.detail ??
        'Error de conexión. Inténtalo de nuevo.'
      );
    }
  }
  if (error instanceof Error) return error.message;
  return 'Error desconocido. Inténtalo de nuevo.';
}
