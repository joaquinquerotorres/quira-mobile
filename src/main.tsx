import React from 'react';
import { createRoot } from 'react-dom/client';
import { addIcons } from 'ionicons';
import { lockClosedOutline } from 'ionicons/icons';
import { initSentry } from './instrument/sentry';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

import { defineCustomElements } from '@ionic/pwa-elements/loader';

addIcons({ lock: lockClosedOutline });

// En entorno no nativo (p. ej. Cypress/CI sobre el bundle Vite), evitamos "/" antes del router.
if (typeof window !== 'undefined' && window.location?.pathname === '/') {
  window.history.replaceState({}, '', '/login');
}

initSentry();
defineCustomElements(window);

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);