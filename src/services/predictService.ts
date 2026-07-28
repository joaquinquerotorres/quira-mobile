/**
 * Flujo híbrido de análisis IA:
 * 1) Subir media a Supabase (ticket + PUT)
 * 2) POST /predict con URLs (cuerpo JSON pequeño)
 * 3) Si 202 → polling GET /predict/tasks/{id}
 */
import api from '../api/axios';
import {
  PREDICT_POLL_INTERVAL_MS,
  PREDICT_POLL_TIMEOUT_MS,
  PREDICT_REQUEST_TIMEOUT_MS,
} from '../config/httpTimeouts';
import {
  uploadRequestMediaWithTicket,
  type UploadProgressHandler,
} from './uploadService';

export type PredictMediaUrls = {
  photoUrl: string | null;
  audioUrl: string | null;
  videoUrl: string | null;
};

export type PredictByUrlPayload = {
  description?: string;
  location?: string;
  imageUrl?: string | null;
  audioUrl?: string | null;
  videoUrl?: string | null;
};

type PredictTaskResponse = {
  taskId?: string;
  status?: string;
  result?: Record<string, unknown>;
  error?: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollPredictTask(taskId: string): Promise<Record<string, unknown>> {
  const started = Date.now();
  while (Date.now() - started < PREDICT_POLL_TIMEOUT_MS) {
    const { data } = await api.get<PredictTaskResponse>(`/predict/tasks/${taskId}`, {
      timeout: 30_000,
    });
    if (data.status === 'completed' && data.result && typeof data.result === 'object') {
      return data.result;
    }
    if (data.status === 'failed') {
      throw new Error(data.error || 'Error al procesar el análisis con la IA.');
    }
    await sleep(PREDICT_POLL_INTERVAL_MS);
  }
  throw new Error(
    'El análisis está tardando demasiado. Comprueba tu conexión e inténtalo de nuevo.',
  );
}

/**
 * Lanza el análisis. Acepta 200 (resultado listo, transporte sync) o 202 (poll).
 */
export async function requestPredictByUrls(
  payload: PredictByUrlPayload,
): Promise<Record<string, unknown>> {
  const body = {
    description: payload.description ?? '',
    location: payload.location ?? undefined,
    imageUrl: payload.imageUrl || undefined,
    audioUrl: payload.audioUrl || undefined,
    videoUrl: payload.videoUrl || undefined,
  };

  const response = await api.post<PredictTaskResponse | Record<string, unknown>>(
    '/predict',
    body,
    {
      timeout: PREDICT_REQUEST_TIMEOUT_MS,
      validateStatus: (status) => status === 200 || status === 202,
    },
  );

  const data = (response.data ?? {}) as PredictTaskResponse;

  if (response.status === 202) {
    if (!data.taskId) {
      throw new Error('El servidor no devolvió un identificador de tarea.');
    }
    return pollPredictTask(data.taskId);
  }

  // Sync Messenger: { taskId, status, result }
  if (data.status === 'completed' && data.result && typeof data.result === 'object') {
    return data.result;
  }
  if (data.status === 'failed') {
    throw new Error(data.error || 'Error al conectar con el servicio de IA.');
  }

  // Legacy shape (resultado plano de Gemini) por si el backend aún no envuelve
  if (!('taskId' in data) && !('status' in data)) {
    return data as Record<string, unknown>;
  }

  if (data.taskId) {
    return pollPredictTask(data.taskId);
  }

  throw new Error('Respuesta de análisis no reconocida.');
}

export type UploadPrimaryMediaParams = {
  inputMode: 'AUDIO' | 'VIDEO' | 'TEXT';
  photoDataUrl: string | null;
  audioDataUrl: string | null;
  videoDataUrl: string | null;
  onProgress?: UploadProgressHandler;
  onPhase?: (message: string) => void;
};

/**
 * Sube el media principal del paso 1 y devuelve URLs públicas reutilizables en publish.
 */
export async function uploadPrimaryMediaForPredict(
  params: UploadPrimaryMediaParams,
): Promise<PredictMediaUrls> {
  const { inputMode, photoDataUrl, audioDataUrl, videoDataUrl, onProgress, onPhase } = params;
  let photoUrl: string | null = null;
  let audioUrl: string | null = null;
  let videoUrl: string | null = null;

  if (inputMode === 'TEXT' && photoDataUrl) {
    onPhase?.('Subiendo imagen…');
    photoUrl = await uploadRequestMediaWithTicket(photoDataUrl, 'photo', onProgress);
  }
  if (inputMode === 'AUDIO' && audioDataUrl) {
    onPhase?.('Subiendo audio…');
    audioUrl = await uploadRequestMediaWithTicket(audioDataUrl, 'audio', onProgress);
  }
  if (inputMode === 'VIDEO' && videoDataUrl) {
    onPhase?.('Subiendo vídeo…');
    videoUrl = await uploadRequestMediaWithTicket(videoDataUrl, 'video', onProgress);
  }

  return { photoUrl, audioUrl, videoUrl };
}
