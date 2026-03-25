/**
 * Validación de variables de entorno.
 * Fallback a valores por defecto en desarrollo para evitar crashes.
 */

import { DEFAULT_PRIVACY_POLICY_URL } from './publicSite';

const getEnv = (key: string, fallback = ''): string => {
  const value = import.meta.env[key];
  if (value && typeof value === 'string') return value;
  return fallback;
};

const rawApiUrl = getEnv('VITE_API_URL', '/api');
export const env = {
  apiUrl: rawApiUrl,
  /** URL base del servidor (sin /api) para assets, geocoding, etc. */
  serverUrl: rawApiUrl.replace(/\/api\/?$/, '') || '',
  googleMapsKey: getEnv('VITE_GOOGLE_MAPS_KEY', ''),

  // Firebase (web config). No son "secrets" estrictos, pero se mueven a env para
  // evitar hardcodear configuración en el repo y facilitar entornos (dev/stg/prod).
  firebaseApiKey: getEnv('VITE_FIREBASE_API_KEY', ''),
  firebaseAuthDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN', ''),
  firebaseProjectId: getEnv('VITE_FIREBASE_PROJECT_ID', ''),
  firebaseStorageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET', ''),
  firebaseMessagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', ''),
  firebaseAppId: getEnv('VITE_FIREBASE_APP_ID', ''),
  firebaseMeasurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID', ''),

  /**
   * RGPD (art. 13): identidad del responsable y canal de contacto en la app.
   * Configura en `.env` de producción; ver `.env.example`.
   */
  privacyControllerSummary: getEnv('VITE_PRIVACY_CONTROLLER_SUMMARY', ''),
  privacyContactEmail: getEnv('VITE_PRIVACY_CONTACT_EMAIL', ''),
  /** Override con `VITE_PRIVACY_POLICY_URL`; por defecto política en la futura landing quira.app. */
  privacyPolicyUrl: getEnv('VITE_PRIVACY_POLICY_URL', DEFAULT_PRIVACY_POLICY_URL),
} as const;

export const hasGoogleMaps = (): boolean => !!env.googleMapsKey;
