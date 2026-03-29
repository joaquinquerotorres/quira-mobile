/**
 * Extrae el token de verificación de una URL de enlace profundo (https o custom scheme).
 * Ruta esperada: …/verify-email?token=…
 */
export function parseVerifyEmailTokenFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/$/, '') || '/';
    if (path !== '/verify-email' && !path.endsWith('/verify-email')) {
      return null;
    }
    const token = u.searchParams.get('token');
    return token && token.trim().length > 0 ? token : null;
  } catch {
    return null;
  }
}
