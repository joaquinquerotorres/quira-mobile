import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { clearStoredAuthAndRedirectToLogin } from './authSession';

describe('clearStoredAuthAndRedirectToLogin', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    localStorage.setItem('quira_token', 'test-jwt');
    localStorage.setItem('user', JSON.stringify({ id: 1 }));

    const loc = { href: '' } as Location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: loc,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
  });

  it('elimina quira_token y user de localStorage', () => {
    clearStoredAuthAndRedirectToLogin();

    expect(localStorage.getItem('quira_token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('asigna /login a location.href', () => {
    clearStoredAuthAndRedirectToLogin();

    expect(window.location.href).toBe('/login');
  });
});
