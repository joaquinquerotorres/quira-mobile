import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  shouldCompressVideoForUpload,
  maybeCompressVideoDataUrlForPredict,
  PREDICT_VIDEO_MAX_DURATION_COMPRESS_SEC,
  PREDICT_VIDEO_COMPRESS_IF_LARGER_THAN_BYTES,
} from './videoCompressForPredict';

const MB = 1024 * 1024;

describe('shouldCompressVideoForUpload', () => {
  it('con Wi‑Fi o unknown y fichero pequeño, no comprime', () => {
    expect(shouldCompressVideoForUpload('wifi', 100)).toBe(false);
    expect(shouldCompressVideoForUpload('unknown', 500 * 1024)).toBe(false);
  });

  it('con datos móviles o red lenta, comprime aunque el fichero sea pequeño', () => {
    expect(shouldCompressVideoForUpload('cellular', 100)).toBe(true);
    expect(shouldCompressVideoForUpload('slow_or_unreliable', 50)).toBe(true);
  });

  it('con fichero grande (p. ej. >6 MB decodificados), comprime aunque el hint sea wifi/unknown', () => {
    expect(
      shouldCompressVideoForUpload('wifi', PREDICT_VIDEO_COMPRESS_IF_LARGER_THAN_BYTES),
    ).toBe(true);
    expect(
      shouldCompressVideoForUpload(
        'unknown',
        PREDICT_VIDEO_COMPRESS_IF_LARGER_THAN_BYTES + 1,
      ),
    ).toBe(true);
  });

  it('justo por debajo del umbral en wifi, no comprime', () => {
    expect(
      shouldCompressVideoForUpload(
        'wifi',
        PREDICT_VIDEO_COMPRESS_IF_LARGER_THAN_BYTES - 1,
      ),
    ).toBe(false);
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

  it('con hint wifi y payload pequeño no intenta comprimir', async () => {
    const r = await maybeCompressVideoDataUrlForPredict(tinyPngDataUrl, 'wifi');
    expect(r.compressed).toBe(false);
    expect(r.dataUrl).toBe(tinyPngDataUrl);
    expect(r.originalBytes).toBe(r.resultBytes);
  });

  it('con hint unknown y payload pequeño no intenta comprimir', async () => {
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

  it('umbral de tamaño para forzar compresión aun con wifi', () => {
    expect(PREDICT_VIDEO_COMPRESS_IF_LARGER_THAN_BYTES).toBe(6 * MB);
  });
});
