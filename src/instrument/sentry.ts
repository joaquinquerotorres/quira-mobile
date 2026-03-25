import * as Sentry from '@sentry/capacitor';
import { init as sentryReactInit } from '@sentry/react';

/**
 * Inicializa Sentry (JS + bridge nativo Capacitor).
 * Sin VITE_SENTRY_DSN el SDK no arranca (desarrollo local sin proyecto Sentry).
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    return;
  }

  Sentry.init(
    {
      dsn,
      environment: import.meta.env.MODE,
      sendDefaultPii: false,
      integrations: [Sentry.browserTracingIntegration()],
      tracesSampleRate: import.meta.env.PROD ? 0.2 : 0,
    },
    sentryReactInit,
  );
}
