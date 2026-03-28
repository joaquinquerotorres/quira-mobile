/**
 * Timeouts de Axios por tipo de petición.
 * `/predict` con vídeo en base64: no usar el default implícito; en 4G la subida puede tardar minutos.
 * Rango recomendado explícito: 120_000–300_000 ms.
 */
export const PREDICT_REQUEST_TIMEOUT_MS = 300_000;
