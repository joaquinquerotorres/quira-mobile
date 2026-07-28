/**
 * Servicio de subida vía tickets del backend.
 * Flujo: 1) Pedir ticket → 2) PUT a signedUrl → 3) Usar publicUrl
 */
import api from '../api/axios';
import {
  formatPredictMediaLimitMb,
  maxBytesForPredictMedia,
} from '../utils/predictMediaLimits';

interface UploadTicketResponse {
  signedUrl: string;
  publicUrl: string;
  /** Límite del análisis IA (PredictMediaLimits); presente en request-media. */
  maxBytes?: number;
}

export type UploadProgressHandler = (percent: number) => void;

function dataUrlToBlob(dataUrl: string): { blob: Blob; contentType: string } {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/data:(.+);base64/);
  const contentType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { blob: new Blob([bytes], { type: contentType }), contentType };
}

/**
 * PUT con progreso (XHR). Rechaza si status HTTP no es 2xx.
 */
export function putBlobToSignedUrl(
  signedUrl: string,
  blob: Blob,
  contentType: string,
  onProgress?: UploadProgressHandler,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', signedUrl);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable || event.total <= 0) return;
      onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }
      reject(new Error(`Error al subir el archivo (${xhr.status}).`));
    };
    xhr.onerror = () => reject(new Error('Error de red al subir el archivo.'));
    xhr.ontimeout = () => reject(new Error('Tiempo agotado al subir el archivo.'));
    // Subidas grandes en 4G: hasta 5 min
    xhr.timeout = 300_000;
    xhr.send(blob);
  });
}

/**
 * Avatar: ticket + PUT + devolver publicUrl
 */
export async function uploadAvatarWithTicket(
  file: File,
  onProgress?: UploadProgressHandler,
): Promise<string> {
  const { data } = await api.post<UploadTicketResponse>('/upload-ticket/avatar', {
    contentType: file.type,
  });
  await putBlobToSignedUrl(data.signedUrl, file, file.type || 'application/octet-stream', onProgress);
  return data.publicUrl;
}

type MediaType = 'photo' | 'audio' | 'video';

/**
 * Request media: ticket + PUT + devolver publicUrl.
 * Respeta `maxBytes` del ticket (fallback: PredictMediaLimits locales).
 */
export async function uploadRequestMediaWithTicket(
  dataUrl: string,
  type: MediaType,
  onProgress?: UploadProgressHandler,
): Promise<string> {
  const { blob, contentType } = dataUrlToBlob(dataUrl);
  const { data } = await api.post<UploadTicketResponse>('/upload-ticket/request-media', {
    type,
    contentType,
  });
  const maxBytes =
    typeof data.maxBytes === 'number' && data.maxBytes > 0
      ? data.maxBytes
      : maxBytesForPredictMedia(type);
  if (blob.size > maxBytes) {
    const mb = formatPredictMediaLimitMb(maxBytes);
    const label =
      type === 'video' ? 'vídeo' : type === 'audio' ? 'audio' : 'imagen';
    throw new Error(
      `El ${label} es demasiado pesado. Máximo ${mb}MB.`,
    );
  }
  await putBlobToSignedUrl(data.signedUrl, blob, contentType, onProgress);
  return data.publicUrl;
}
