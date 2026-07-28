import { beforeEach, describe, expect, it } from 'vitest';
import {
  ACTIVE_MODE_KEY,
  clearActiveMode,
  getActiveMode,
  getEffectiveActiveMode,
  hasDualProfiles,
  homePathForMode,
  resolvePostLoginPath,
  setActiveMode,
} from './activeMode';

describe('activeMode', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores and reads mode', () => {
    setActiveMode('pro');
    expect(getActiveMode()).toBe('pro');
    expect(localStorage.getItem(ACTIVE_MODE_KEY)).toBe('pro');
    clearActiveMode();
    expect(getActiveMode()).toBeNull();
  });

  it('detects dual profiles', () => {
    expect(
      hasDualProfiles({
        clientProfile: { id: 1 },
        professionalProfile: { id: 2 },
      }),
    ).toBe(true);
    expect(hasDualProfiles({ clientProfile: { id: 1 } })).toBe(false);
  });

  it('resolvePostLoginPath sends dual users to choose-mode', () => {
    expect(
      resolvePostLoginPath({
        clientProfile: {},
        professionalProfile: {},
      }),
    ).toBe('/choose-mode');
    expect(getActiveMode()).toBeNull();
  });

  it('resolvePostLoginPath sets client for client-only', () => {
    expect(resolvePostLoginPath({ clientProfile: {} })).toBe('/request-list');
    expect(getActiveMode()).toBe('client');
  });

  it('resolvePostLoginPath sets pro for pro-only', () => {
    expect(resolvePostLoginPath({ professionalProfile: {} })).toBe('/market');
    expect(getActiveMode()).toBe('pro');
  });

  it('homePathForMode', () => {
    expect(homePathForMode('client')).toBe('/request-list');
    expect(homePathForMode('pro')).toBe('/market');
  });

  it('getEffectiveActiveMode defaults to client', () => {
    expect(getEffectiveActiveMode()).toBe('client');
  });
});
