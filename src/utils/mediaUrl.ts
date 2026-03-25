import { env } from '../config/env';

const serverUrl = env.serverUrl;

/**
 * Resuelve la URL de un media (foto, audio, vídeo).
 * Si la URL es absoluta (Supabase, CDN), se usa tal cual.
 * Si es relativa, se le antepone serverUrl.
 */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${serverUrl}${url}`;
}
