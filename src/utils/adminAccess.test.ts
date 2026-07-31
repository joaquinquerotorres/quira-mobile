import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { hasAdminRole, isStoredUserAdmin, ROLE_ADMIN } from './adminAccess';

describe('adminAccess', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it('detects ROLE_ADMIN', () => {
    expect(hasAdminRole({ roles: [ROLE_ADMIN] })).toBe(true);
    expect(hasAdminRole({ roles: ['ROLE_CLIENT', ROLE_ADMIN] })).toBe(true);
    expect(hasAdminRole({ roles: ['ROLE_PRO'] })).toBe(false);
    expect(hasAdminRole({ roles: null })).toBe(false);
    expect(hasAdminRole(null)).toBe(false);
  });

  it('reads admin from localStorage', () => {
    expect(isStoredUserAdmin()).toBe(false);
    localStorage.setItem(
      'user',
      JSON.stringify({ roles: ['ROLE_CLIENT', ROLE_ADMIN] }),
    );
    expect(isStoredUserAdmin()).toBe(true);
  });
});
