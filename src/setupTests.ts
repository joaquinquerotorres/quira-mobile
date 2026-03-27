// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/extend-expect';

import React from 'react';
import { afterEach } from 'vitest';

/**
 * El web component ion-app programa trabajo async (rIC / setTimeout) que puede
 * ejecutarse tras desmontar jsdom → ReferenceError: window is not defined.
 * En tests no necesitamos ese lifecycle; passthrough evita timers colgados.
 */
vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return {
    ...actual,
    IonApp: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

import { setupIonicReact } from '@ionic/react';

setupIonicReact();

// Mock matchmedia
window.matchMedia = window.matchMedia || function() {
  return {
      matches: false,
      addListener: function() {},
      removeListener: function() {}
  };
};

// Mock localStorage for jsdom (usar clearStorage() en beforeEach para aislamiento)
const storage: Record<string, string> = {};
export const clearStorage = () => {
  Object.keys(storage).forEach((k) => delete storage[k]);
};
const localStorageMock = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, value: string) => { storage[key] = value; },
  removeItem: (key: string) => { delete storage[key]; },
  clear: clearStorage,
  key: () => null,
  length: 0,
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Prevent Ionic internal timers from firing after jsdom teardown.
afterEach(() => {
  // Best-effort cleanup (jsdom + Ionic can schedule async work).
  try {
    vi.runOnlyPendingTimers();
  } catch {
    // ignore if timers are not faked
  }
});

vi.mock('@sentry/capacitor', () => ({
  captureException: vi.fn(),
  init: vi.fn(),
}));

// Mock Firebase/Capacitor
vi.mock('@capacitor-firebase/authentication', () => ({
  FirebaseAuthentication: {
    getCurrentUser: () => Promise.resolve({ user: null }),
    addListener: () => ({ remove: () => {} }),
    signInWithGoogle: () => Promise.reject(new Error('mocked')),
    signInWithApple: () => Promise.reject(new Error('mocked')),
    getIdToken: () => Promise.resolve({ token: 'mocked-token' }),
  },
}));

// Mock Google Places autocomplete (requires Google script in real runtime).
vi.mock('react-google-places-autocomplete', async () => {
  const React = (await import('react')).default;
  return {
    __esModule: true,
    default: () => React.createElement('div', { 'data-testid': 'google-places-autocomplete' }),
    geocodeByAddress: () => Promise.resolve([]),
    getLatLng: () => Promise.resolve({ lat: 0, lng: 0 }),
  };
});

