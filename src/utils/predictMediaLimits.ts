/**
 * Límites de tamaño para media de predict / request (alineados con
 * `PredictMediaLimits` del API: imagen 10 MB, audio 12 MB, vídeo 40 MB).
 *
 * Mismo tope en Wi‑Fi y datos móviles. El ticket
 * `POST /upload-ticket/request-media` incluye `maxBytes`; preferir ese valor
 * en la subida. Estas constantes sirven de fallback y para validación UI previa.
 */

export const PREDICT_IMAGE_MAX_BYTES = 10_000_000;
export const PREDICT_AUDIO_MAX_BYTES = 12_000_000;
export const PREDICT_VIDEO_MAX_BYTES = 40_000_000;

export type PredictMediaLimitType = 'photo' | 'image' | 'audio' | 'video';

export function maxBytesForPredictMedia(type: PredictMediaLimitType): number {
  switch (type) {
    case 'photo':
    case 'image':
      return PREDICT_IMAGE_MAX_BYTES;
    case 'audio':
      return PREDICT_AUDIO_MAX_BYTES;
    case 'video':
      return PREDICT_VIDEO_MAX_BYTES;
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

/** Etiqueta corta en MB decimales (p. ej. 40_000_000 → "40"). */
export function formatPredictMediaLimitMb(bytes: number): string {
  return String(Math.round(bytes / 1_000_000));
}
