/**
 * Timeouts de Axios / polling por tipo de petición.
 *
 * Tras el flujo híbrido (subida a Supabase + /predict por URL), el POST /predict
 * ya no transporta base64: el timeout cubre sobre todo la espera de Gemini (sync)
 * o el arranque de la tarea (async).
 */
export const PREDICT_REQUEST_TIMEOUT_MS = 120_000;

/** Intervalo entre GET /predict/tasks/{id} */
export const PREDICT_POLL_INTERVAL_MS = 1_500;

/** Tiempo máximo total de polling tras un 202 Accepted */
export const PREDICT_POLL_TIMEOUT_MS = 180_000;
