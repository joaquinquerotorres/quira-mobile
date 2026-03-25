/**
 * Servicio de subida vía tickets del backend.
 * Flujo: 1) Pedir ticket → 2) PUT a signedUrl → 3) Usar publicUrl
 */
import api from '../api/axios';

interface UploadTicketResponse {
  signedUrl: string;
  publicUrl: string;
}

/**
 * Avatar: ticket + PUT + devolver publicUrl
 */
export async function uploadAvatarWithTicket(file: File): Promise<string> {
  const { data } = await api.post<UploadTicketResponse>('/upload-ticket/avatar', {
    contentType: file.type,
  });
  await fetch(data.signedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });
  return data.publicUrl;
}

/**
 * Convierte base64 data URL a Blob
 */
function dataUrlToBlob(dataUrl: string): { blob: Blob; contentType: string } {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/data:(.+);base64/);
  const contentType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { blob: new Blob([bytes], { type: contentType }), contentType };
}

type MediaType = 'photo' | 'audio' | 'video';

/**
 * Request media: ticket + PUT + devolver publicUrl
 */
export async function uploadRequestMediaWithTicket(
  dataUrl: string,
  type: MediaType
): Promise<string> {
  const { blob, contentType } = dataUrlToBlob(dataUrl);
  const { data } = await api.post<UploadTicketResponse>('/upload-ticket/request-media', {
    type,
  });
  await fetch(data.signedUrl, {
    method: 'PUT',
    body: blob,
    headers: { 'Content-Type': contentType },
  });
  return data.publicUrl;
}
