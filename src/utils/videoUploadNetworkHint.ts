import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';

export type VideoUploadConnectionHint =
  | 'wifi'
  | 'cellular'
  | 'slow_or_unreliable'
  | 'unknown';

interface NavigatorWithConnection extends Navigator {
  connection?: {
    effectiveType?: string;
  };
}

/**
 * Indicador para avisar al usuario en la pestaña vídeo.
 * - En app nativa (Capacitor): distingue Wi‑Fi vs datos móviles vía @capacitor/network.
 * - En navegador no se puede saber Wi‑Fi vs 4G; solo marcamos conexiones lentas (Network Information API).
 */
export async function getVideoUploadConnectionHint(): Promise<VideoUploadConnectionHint> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { connectionType } = await Network.getStatus();
      if (connectionType === 'wifi') return 'wifi';
      if (connectionType === 'cellular') return 'cellular';
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  if (typeof navigator === 'undefined') return 'unknown';

  const effectiveType = (navigator as NavigatorWithConnection).connection
    ?.effectiveType;
  if (
    effectiveType === 'slow-2g' ||
    effectiveType === '2g' ||
    effectiveType === '3g'
  ) {
    return 'slow_or_unreliable';
  }

  return 'unknown';
}
