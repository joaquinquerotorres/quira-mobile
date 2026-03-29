import type { VideoUploadConnectionHint } from './videoUploadNetworkHint';

/**
 * Re-codificación **moderada** orientada a modelos multimodales (p. ej. Gemini): suficiente resolución
 * y bitrate para entender gestos, objetos y audio, sin calidad de estudio (innecesaria para el diagnóstico).
 */
export const PREDICT_VIDEO_MAX_WIDTH = 960;
export const PREDICT_VIDEO_TARGET_FPS = 24;
/** Bitrate acotado pero legible para análisis de vídeo por IA (no “miniatura ilegible”). */
export const PREDICT_VIDEO_BITS_PER_SECOND = 2_500_000;

/**
 * No intentar re-codificar vídeos **más largos** que esto (riesgo de memoria / tiempo en el dispositivo).
 * Vídeos más cortos **sí** pueden comprimirse cuando la red lo amerita (véase {@link shouldCompressVideoForUpload}).
 */
export const PREDICT_VIDEO_MAX_DURATION_COMPRESS_SEC = 300;

/**
 * ¿Intentar compresión antes de `/predict`?
 * - **Sí** solo con **datos móviles** (`cellular`) o red **lenta** (`slow_or_unreliable`).
 * - **No** con **Wi‑Fi** ni con estado `unknown`: en Wi‑Fi suele bastar subir el original; no forzamos compresión.
 *
 * La compresión no busca el mínimo tamaño posible, sino aligerar la subida **manteniendo** calidad útil para Gemini
 * (ver constantes de ancho/bitrate arriba).
 */
export function shouldCompressVideoForUpload(
  hint: VideoUploadConnectionHint,
): boolean {
  return hint === 'cellular' || hint === 'slow_or_unreliable';
}

function dataUrlByteLength(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1];
  if (!base64) return dataUrl.length;
  return Math.floor((base64.length * 3) / 4);
}

function pickRecorderMime(): string {
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
    return 'video/webm';
  }
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return 'video/webm';
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('readAsDataURL failed'));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, b64] = dataUrl.split(',');
  const mime = header.match(/^data:([^;]+)/)?.[1] ?? 'application/octet-stream';
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/**
 * Re-encode moderado: escala ancho máx. {@link PREDICT_VIDEO_MAX_WIDTH}, bitrate fijo,
 * mantiene audio del vídeo original combinando pista de vídeo del canvas + audio del elemento.
 * Si el entorno no soporta la API o falla, lanza error (el caller hace fallback al original).
 */
export async function compressVideoDataUrlModerate(
  dataUrl: string,
): Promise<{ dataUrl: string; originalBytes: number; resultBytes: number }> {
  const originalBytes = dataUrlByteLength(dataUrl);
  if (typeof document === 'undefined' || typeof MediaRecorder === 'undefined') {
    throw new Error('compress: no MediaRecorder');
  }

  const blob = dataUrlToBlob(dataUrl);
  const url = URL.createObjectURL(blob);

  const video = document.createElement('video');
  /** `volume = 0` evita audio por altavoz; suele conservar pista de audio en `captureStream` mejor que `muted`. */
  video.volume = 0;
  video.muted = false;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.crossOrigin = 'anonymous';
  video.src = url;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('video load error'));
  });

  const duration = video.duration;
  if (!Number.isFinite(duration) || duration <= 0) {
    URL.revokeObjectURL(url);
    throw new Error('invalid duration');
  }
  if (duration > PREDICT_VIDEO_MAX_DURATION_COMPRESS_SEC) {
    URL.revokeObjectURL(url);
    throw new Error('video too long for client compress');
  }

  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) {
    URL.revokeObjectURL(url);
    throw new Error('missing video dimensions');
  }

  const scale = Math.min(1, PREDICT_VIDEO_MAX_WIDTH / vw);
  const cw = Math.max(2, Math.round(vw * scale));
  const ch = Math.max(2, Math.round(vh * scale));

  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    URL.revokeObjectURL(url);
    throw new Error('no canvas context');
  }

  const draw = () => {
    ctx.drawImage(video, 0, 0, cw, ch);
  };

  const mimeType = pickRecorderMime();
  const canvasStream = canvas.captureStream(PREDICT_VIDEO_TARGET_FPS);

  const captureFromVideo = (
    video as HTMLVideoElement & { captureStream?: () => MediaStream }
  ).captureStream;
  const srcStream =
    typeof captureFromVideo === 'function' ? captureFromVideo.call(video) : null;
  const videoTrack = canvasStream.getVideoTracks()[0];
  const audioTracks = srcStream?.getAudioTracks() ?? [];
  const outTracks: MediaStreamTrack[] = [videoTrack];
  for (const t of audioTracks) outTracks.push(t);
  const outStream = new MediaStream(outTracks);

  const recorder = new MediaRecorder(outStream, {
    mimeType,
    videoBitsPerSecond: PREDICT_VIDEO_BITS_PER_SECOND,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };

  const stopped = new Promise<Blob>((resolve, reject) => {
    recorder.onerror = () => reject(new Error('MediaRecorder error'));
    recorder.onstop = () => {
      const type = mimeType.split(';')[0] || 'video/webm';
      resolve(new Blob(chunks, { type }));
    };
  });

  await video.play();
  recorder.start(200);

  await new Promise<void>((resolve, reject) => {
    let finished = false;
    video.onerror = () => reject(new Error('playback error'));
    const finish = () => {
      if (finished) return;
      finished = true;
      draw();
      try {
        recorder.stop();
      } catch {
        /* ignore */
      }
      resolve();
    };
    const loop = () => {
      if (video.ended) {
        finish();
        return;
      }
      draw();
      requestAnimationFrame(loop);
    };
    video.onended = finish;
    requestAnimationFrame(loop);
  });

  video.pause();
  URL.revokeObjectURL(url);

  const outBlob = await stopped;
  const outDataUrl = await blobToDataUrl(outBlob);
  const resultBytes = dataUrlByteLength(outDataUrl);

  if (resultBytes >= originalBytes * 0.98) {
    throw new Error('compress did not reduce size meaningfully');
  }

  return { dataUrl: outDataUrl, originalBytes, resultBytes };
}

export interface MaybeCompressVideoResult {
  dataUrl: string;
  compressed: boolean;
  originalBytes: number;
  resultBytes: number;
}

/**
 * Si la red **no** es móvil ni lenta (p. ej. Wi‑Fi), devuelve el mismo data URL.
 * Si aplica compresión y la re-codificación tiene éxito, devuelve el nuevo data URL (p. ej. WebM).
 * Ante cualquier fallo, devuelve el original sin lanzar.
 */
export async function maybeCompressVideoDataUrlForPredict(
  dataUrl: string,
  hint: VideoUploadConnectionHint,
): Promise<MaybeCompressVideoResult> {
  const originalBytes = dataUrlByteLength(dataUrl);
  if (!shouldCompressVideoForUpload(hint)) {
    return {
      dataUrl,
      compressed: false,
      originalBytes,
      resultBytes: originalBytes,
    };
  }

  try {
    const r = await compressVideoDataUrlModerate(dataUrl);
    return {
      dataUrl: r.dataUrl,
      compressed: true,
      originalBytes: r.originalBytes,
      resultBytes: r.resultBytes,
    };
  } catch {
    return {
      dataUrl,
      compressed: false,
      originalBytes,
      resultBytes: originalBytes,
    };
  }
}
