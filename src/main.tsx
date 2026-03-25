import React from 'react';
import { createRoot } from 'react-dom/client';
import { initSentry } from './instrument/sentry';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

import { defineCustomElements } from '@ionic/pwa-elements/loader';

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