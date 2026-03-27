import { describe, expect, it, vi } from 'vitest';

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: () => 'web',
  },
}));

import {
  buildAudioDataUrlForApi,
  pickMediaRecorderMimeType,
  sniffAudioMimeFromBase64Payload,
} from './audioDataUrl';

/** Base64 de los 4 primeros bytes EBML WebM (1A 45 DF A3) + relleno. */
const WEBM_PREFIX_B64 = (() => {
  const u = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0xff, 0xff]);
  let s = '';
  for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]!);
  return btoa(s);
})();

describe('audioDataUrl', () => {
  it('sniffAudioMimeFromBase64Payload detecta WebM', () => {
    expect(sniffAudioMimeFromBase64Payload(WEBM_PREFIX_B64)).toBe('audio/webm');
  });

  it('buildAudioDataUrlForApi corrige audio/mpeg si el binario es WebM', () => {
    const url = buildAudioDataUrlForApi({
      recordDataBase64: WEBM_PREFIX_B64 + 'Zm9vYmFy', // + junk base64
      mimeType: 'audio/mpeg',
    });
    expect(url).toBeTruthy();
    expect(url!.startsWith('data:audio/webm')).toBe(true);
  });

  it('buildAudioDataUrlForApi respeta data URL ya bien formada', () => {
    const inner = WEBM_PREFIX_B64.replace(/\s/g, '');
    const raw = `data:audio/webm;base64,${inner}`;
    const url = buildAudioDataUrlForApi({
      recordDataBase64: raw,
      mimeType: 'ignored',
    });
    expect(url).toContain('audio/webm');
    expect(url).toContain(inner);
  });

  it('pickMediaRecorderMimeType devuelve algo en entorno con MediaRecorder mockeado o real', () => {
    const m = pickMediaRecorderMimeType();
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
      expect(m === null || typeof m === 'string').toBe(true);
    }
  });
});
