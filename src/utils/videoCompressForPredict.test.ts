import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  shouldCompressVideoForUpload,
  maybeCompressVideoDataUrlForPredict,
  PREDICT_VIDEO_MAX_DURATION_COMPRESS_SEC,
} from './videoCompressForPredict';

describe('shouldCompressVideoForUpload', () => {
  it('solo comprime en datos móviles o red lenta; no en Wi‑Fi ni unknown', () => {
    expect(shouldCompressVideoForUpload('wifi')).toBe(false);
    expect(shouldCompressVideoForUpload('unknown')).toBe(false);
    expect(shouldCompressVideoForUpload('cellular')).toBe(true);
    expect(shouldCompressVideoForUpload('slow_or_unreliable')).toBe(true);
  });
});

describe('maybeCompressVideoDataUrlForPredict', () => {
  const tinyPngDataUrl =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  beforeEach(() => {
    vi.stubGlobal(
      'MediaRecorder',
      class {
        static isTypeSupported = () => false;
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('con hint wifi no intenta comprimir', async () => {
    const r = await maybeCompressVideoDataUrlForPredict(tinyPngDataUrl, 'wifi');
    expect(r.compressed).toBe(false);
    expect(r.dataUrl).toBe(tinyPngDataUrl);
    expect(r.originalBytes).toBe(r.resultBytes);
  });

  it('con hint unknown no intenta comprimir', async () => {
    const r = await maybeCompressVideoDataUrlForPredict(
      tinyPngDataUrl,
      'unknown',
    );
    expect(r.compressed).toBe(false);
    expect(r.dataUrl).toBe(tinyPngDataUrl);
  });

  it('con hint cellular intenta comprimir y ante fallo devuelve el original', async () => {
    const r = await maybeCompressVideoDataUrlForPredict(
      tinyPngDataUrl,
      'cellular',
    );
    expect(r.compressed).toBe(false);
    expect(r.dataUrl).toBe(tinyPngDataUrl);
  });
});

describe('constantes', () => {
  it('duración máxima para intentar compresión en cliente es 5 min (solo se omite por encima)', () => {
    expect(PREDICT_VIDEO_MAX_DURATION_COMPRESS_SEC).toBe(300);
  });
});
