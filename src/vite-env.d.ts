/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** DSN público del proyecto Sentry (opcional). Sin valor, Sentry no se inicializa. */
  readonly VITE_SENTRY_DSN?: string;
  /** Identidad del responsable del tratamiento (texto libre: nombre, NIF, domicilio). */
  readonly VITE_PRIVACY_CONTROLLER_SUMMARY?: string;
  /** Email para privacidad y ejercicio de derechos RGPD. */
  readonly VITE_PRIVACY_CONTACT_EMAIL?: string;
  /** URL de la política de privacidad completa en el sitio público / landing (opcional). */
  readonly VITE_PRIVACY_POLICY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
