export type RequestMediaKind = 'photo' | 'video' | 'audio';

export interface RequestMediaItem {
  kind: RequestMediaKind;
  url: string;
}

export type RequestMediaSources = {
  photoUrl?: string | null;
  videoUrl?: string | null;
  audioUrl?: string | null;
  /** Media adicional (step 2 / API). */
  extraPhotoUrls?: Array<string | null | undefined> | null;
  extraVideoUrls?: Array<string | null | undefined> | null;
  extraAudioUrls?: Array<string | null | undefined> | null;
};

/** Normaliza URLs de media; descarta vacíos / placeholders. */
export function normalizeMediaUrl(url?: string | null): string | null {
  if (typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (lower === 'null' || lower === 'undefined') return null;
  return trimmed;
}

function pushNormalizedUrls(
  items: RequestMediaItem[],
  kind: RequestMediaKind,
  urls: Array<string | null | undefined> | null | undefined,
) {
  if (!urls?.length) return;
  for (const raw of urls) {
    const url = normalizeMediaUrl(raw);
    if (url) items.push({ kind, url });
  }
}

/**
 * Recoge todo el media de una solicitud: principal + opcionales.
 * Orden: foto/vídeo/audio principales, luego extras del mismo tipo.
 */
export function collectRequestMedia(input: RequestMediaSources): RequestMediaItem[] {
  const items: RequestMediaItem[] = [];
  const photo = normalizeMediaUrl(input.photoUrl);
  const video = normalizeMediaUrl(input.videoUrl);
  const audio = normalizeMediaUrl(input.audioUrl);
  if (photo) items.push({ kind: 'photo', url: photo });
  if (video) items.push({ kind: 'video', url: video });
  if (audio) items.push({ kind: 'audio', url: audio });
  pushNormalizedUrls(items, 'photo', input.extraPhotoUrls);
  pushNormalizedUrls(items, 'video', input.extraVideoUrls);
  pushNormalizedUrls(items, 'audio', input.extraAudioUrls);
  return items;
}

export function hasRequestMedia(input: RequestMediaSources): boolean {
  return collectRequestMedia(input).length > 0;
}
