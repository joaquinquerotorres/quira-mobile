/**
 * Dominio público del producto (sin secretos). Ajusta si el fork usa otro dominio.
 */
export const PUBLIC_SITE_ORIGIN = 'https://quira.app';

/** API pública documentada / usada por el cliente en producción. */
export const API_PUBLIC_ORIGIN = 'https://api.quira.app';

/** Política de privacidad en el sitio público (`landing/`); por defecto coincide con `landing/privacidad/`. */
export const DEFAULT_PRIVACY_POLICY_URL = `${PUBLIC_SITE_ORIGIN}/privacidad`;
