export type RequestMediaKind = 'photo' | 'video' | 'audio';

export interface RequestMediaItem {
  kind: RequestMediaKind;
  url: string;
}

/** Normaliza URLs de media; descarta vacíos / placeholders. */
export function normalizeMediaUrl(url?: string | null): string | null {
  if (typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (lower === 'null' || lower === 'undefined') return null;
  return trimmed;
}

export function collectRequestMedia(input: {
  photoUrl?: string | null;
  videoUrl?: string | null;
  audioUrl?: string | null;
}): RequestMediaItem[] {
  const items: RequestMediaItem[] = [];
  const photo = normalizeMediaUrl(input.photoUrl);
  const video = normalizeMediaUrl(input.videoUrl);
  const audio = normalizeMediaUrl(input.audioUrl);
  if (photo) items.push({ kind: 'photo', url: photo });
  if (video) items.push({ kind: 'video', url: video });
  if (audio) items.push({ kind: 'audio', url: audio });
  return items;
}

export function hasRequestMedia(input: {
  photoUrl?: string | null;
  videoUrl?: string | null;
  audioUrl?: string | null;
}): boolean {
  return collectRequestMedia(input).length > 0;
}
