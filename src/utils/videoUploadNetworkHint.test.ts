import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Capacitor } from '@capacitor/core';
import { getVideoUploadConnectionHint } from './videoUploadNetworkHint';

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
  },
}));

const getStatus = vi.fn();
vi.mock('@capacitor/network', () => ({
  Network: {
    getStatus: (...args: unknown[]) => getStatus(...args),
    addListener: vi.fn(() => Promise.resolve({ remove: vi.fn() })),
  },
}));

describe('getVideoUploadConnectionHint', () => {
  const originalConnection = typeof navigator !== 'undefined'
    ? (navigator as Navigator & { connection?: { effectiveType?: string } })
        .connection
    : undefined;

  beforeEach(() => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    getStatus.mockReset();
    if (typeof navigator !== 'undefined') {
      Object.defineProperty(navigator, 'connection', {
        configurable: true,
        value: undefined,
        writable: true,
      });
    }
  });

  afterEach(() => {
    if (typeof navigator !== 'undefined') {
      Object.defineProperty(navigator, 'connection', {
        configurable: true,
        value: originalConnection,
        writable: true,
      });
    }
  });

  it('sin plataforma nativa y sin connection devuelve unknown', async () => {
    expect(await getVideoUploadConnectionHint()).toBe('unknown');
  });

  it('sin plataforma nativa y effectiveType 3g devuelve slow_or_unreliable', async () => {
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: { effectiveType: '3g' },
      writable: true,
    });
    expect(await getVideoUploadConnectionHint()).toBe('slow_or_unreliable');
  });

  it('sin plataforma nativa y 4g devuelve unknown (no se distingue Wi‑Fi vs datos móviles)', async () => {
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: { effectiveType: '4g' },
      writable: true,
    });
    expect(await getVideoUploadConnectionHint()).toBe('unknown');
  });

  it('en nativo con cellular devuelve cellular', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    getStatus.mockResolvedValue({ connected: true, connectionType: 'cellular' });
    expect(await getVideoUploadConnectionHint()).toBe('cellular');
  });

  it('en nativo con wifi devuelve wifi', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    getStatus.mockResolvedValue({ connected: true, connectionType: 'wifi' });
    expect(await getVideoUploadConnectionHint()).toBe('wifi');
  });
});
