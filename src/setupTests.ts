// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/extend-expect';

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

