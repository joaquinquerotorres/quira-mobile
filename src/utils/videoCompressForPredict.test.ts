import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  shouldCompressVideoForUpload,
  maybeCompressVideoDataUrlForPredict,
  predictVideoPayloadDecodedBytes,
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

describe('predictVideoPayloadDecodedBytes', () => {
  it('calcula bytes decodificados del payload base64 (PNG 1×1)', () => {
    const dataUrl =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const n = predictVideoPayloadDecodedBytes(dataUrl);
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThan(500);
  });

  it('coincide con el tamaño binario real (Buffer en Node)', () => {
    const buf = Buffer.alloc(256, 7);
    const b64 = buf.toString('base64');
    const dataUrl = `data:application/octet-stream;base64,${b64}`;
    expect(predictVideoPayloadDecodedBytes(dataUrl)).toBe(256);
  });

  it('shouldCompress en Wi‑Fi usa el mismo criterio de bytes que predictVideoPayloadDecodedBytes', () => {
    const bytes = PREDICT_VIDEO_LARGE_BYTES_WIFI_OR_UNKNOWN;
    expect(shouldCompressVideoForUpload('wifi', bytes)).toBe(true);
    expect(shouldCompressVideoForUpload('wifi', bytes - 1)).toBe(false);
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
