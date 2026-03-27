import { Capacitor } from '@capacitor/core';

/** Orden de prueba para MediaRecorder (web / plugin interno). */
export const MEDIA_RECORDER_MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
  'audio/ogg',
] as const;

export function pickMediaRecorderMimeType(): string | null {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return null;
  }
  for (const t of MEDIA_RECORDER_MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return null;
}

function decodeBase64Start(base64: string, maxBytes: number): Uint8Array | null {
  const clean = base64.replace(/\s/g, '').replace(/^data:[^;]+;base64,/i, '');
  const approxChars = Math.min(clean.length, Math.ceil((maxBytes * 4) / 3) + 8);
  const slice = clean.slice(0, approxChars);
  try {
    const binary = atob(slice);
    const n = Math.min(binary.length, maxBytes);
    const out = new Uint8Array(n);
    for (let i = 0; i < n; i++) out[i] = binary.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

/** Heurística por cabecera binaria (evita etiquetar WebM como MP3). */
export function sniffAudioMimeFromBase64Payload(base64: string): string | null {
  const bytes = decodeBase64Start(base64, 48);
  if (!bytes || bytes.length < 4) return null;
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return 'audio/webm';
  }
  if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) return 'audio/mpeg';
  if (
    bytes.length >= 12 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    return 'audio/mp4';
  }
  if (bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) {
    return 'audio/ogg';
  }
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    return 'audio/wav';
  }
  return null;
}

function platformFallbackMime(): string {
  const p = Capacitor.getPlatform();
  if (p === 'ios' || p === 'android') return 'audio/mp4';
  return 'audio/webm';
}

export function parseDataUrlParts(dataUrl: string): { mime: string; base64: string } | null {
  const idx = dataUrl.indexOf(';base64,');
  if (idx === -1) return null;
  const header = dataUrl.slice(0, idx);
  const mime = header.replace(/^data:/i, '').trim();
  const base64 = dataUrl.slice(idx + 8).replace(/\s/g, '');
  if (!mime || !base64) return null;
  return { mime, base64 };
}

function reconcileDeclaredMimeWithSniff(
  declared: string,
  base64: string,
): string {
  const sniffed = sniffAudioMimeFromBase64Payload(base64);
  const d = declared.toLowerCase().split(';')[0];
  if (sniffed === 'audio/webm' && d !== 'audio/webm' && !declared.toLowerCase().includes('webm')) {
    return 'audio/webm';
  }
  if (
    sniffed &&
    (d === 'audio/mpeg' || d === 'audio/mp3' || d === 'audio/mp4') &&
    sniffed === 'audio/webm'
  ) {
    return sniffed;
  }
  if (!declared.trim() || declared === 'application/octet-stream') {
    return sniffed || platformFallbackMime();
  }
  if ((d === 'audio/mpeg' || d === 'audio/mp3') && !sniffed) {
    return platformFallbackMime();
  }
  return declared.trim();
}

export interface VoiceRecorderPayload {
  recordDataBase64?: string;
  mimeType?: string;
  msDuration?: number;
}

/**
 * Construye `data:<mime>;base64,<payload>` coherente con el binario para /predict y subidas.
 * No usa audio/mpeg como valor por defecto genérico.
 */
export function buildAudioDataUrlForApi(value: VoiceRecorderPayload): string | null {
  const raw = value.recordDataBase64;
  if (!raw) return null;

  const trimmed = raw.trim();
  if (trimmed.startsWith('data:')) {
    const parsed = parseDataUrlParts(trimmed);
    if (parsed) {
      const mime = reconcileDeclaredMimeWithSniff(parsed.mime, parsed.base64);
      return `data:${mime};base64,${parsed.base64}`;
    }
  }

  const base64 = trimmed.replace(/^data:[^;]+;base64,/i, '').replace(/\s/g, '');
  let mime = (value.mimeType || '').trim();
  const sniffed = sniffAudioMimeFromBase64Payload(base64);

  if (!mime) {
    mime = sniffed || platformFallbackMime();
  } else {
    mime = reconcileDeclaredMimeWithSniff(mime, base64);
  }

  return `data:${mime};base64,${base64}`;
}

export function audioDataUrlToBlob(dataUrl: string): Blob {
  const p = parseDataUrlParts(dataUrl);
  if (!p) throw new Error('Invalid audio data URL');
  const binary = atob(p.base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: p.mime });
}

/** Extensión sugerida para nombrar un File según MIME. */
export function extensionForAudioMime(mime: string): string {
  const base = mime.split(';')[0].toLowerCase();
  if (base.includes('webm')) return 'webm';
  if (base.includes('mp4') || base.includes('m4a')) return 'm4a';
  if (base.includes('mpeg') || base === 'audio/mp3') return 'mp3';
  if (base.includes('ogg')) return 'ogg';
  if (base.includes('wav')) return 'wav';
  if (base.includes('aac')) return 'aac';
  return 'bin';
}
