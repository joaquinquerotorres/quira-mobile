export type RequestMediaKind = 'photo' | 'video' | 'audio';

export interface RequestMediaItem {
  kind: RequestMediaKind;
  url: string;
}

export function collectRequestMedia(input: {
  photoUrl?: string | null;
  videoUrl?: string | null;
  audioUrl?: string | null;
}): RequestMediaItem[] {
  const items: RequestMediaItem[] = [];
  if (input.photoUrl) items.push({ kind: 'photo', url: input.photoUrl });
  if (input.videoUrl) items.push({ kind: 'video', url: input.videoUrl });
  if (input.audioUrl) items.push({ kind: 'audio', url: input.audioUrl });
  return items;
}

export function hasRequestMedia(input: {
  photoUrl?: string | null;
  videoUrl?: string | null;
  audioUrl?: string | null;
}): boolean {
  return collectRequestMedia(input).length > 0;
}
