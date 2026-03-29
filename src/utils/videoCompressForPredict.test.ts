import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  shouldCompressVideoForUpload,
  maybeCompressVideoDataUrlForPredict,
  PREDICT_VIDEO_MAX_DURATION_COMPRESS_SEC,
  PREDICT_VIDEO_LARGE_BYTES_WIFI_OR_UNKNOWN,
} from './videoCompressForPredict';

const MB = 1024 * 1024;

describe('shouldCompressVideoForUpload', () => {
  it('siempre comprime en datos móviles o red lenta (tamaño da igual)', () => {
    expect(shouldCompressVideoForUpload('cellular', 100)).toBe(true);
    expect(shouldCompressVideoForUpload('slow_or_unreliable', 0)).toBe(true);
  });

  it('en Wi‑Fi o unknown solo si el vídeo supera el umbral “grande” (~10 MB)', () => {
    expect(
      shouldCompressVideoForUpload(
        'wifi',
        PREDICT_VIDEO_LARGE_BYTES_WIFI_OR_UNKNOWN - 1,
      ),
    ).toBe(false);
    expect(
      shouldCompressVideoForUpload(
        'wifi',
        PREDICT_VIDEO_LARGE_BYTES_WIFI_OR_UNKNOWN,
      ),
    ).toBe(true);
    expect(
      shouldCompressVideoForUpload(
        'unknown',
        PREDICT_VIDEO_LARGE_BYTES_WIFI_OR_UNKNOWN + 1,
      ),
    ).toBe(true);
    expect(shouldCompressVideoForUpload('unknown', 500 * 1024)).toBe(false);
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

  it('umbral “grande” para Wi‑Fi / unknown es 10 MB decodificados', () => {
    expect(PREDICT_VIDEO_LARGE_BYTES_WIFI_OR_UNKNOWN).toBe(10 * MB);
  });
});
