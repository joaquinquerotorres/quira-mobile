import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import { Router } from 'react-router-dom';
import DeepLinkHandler from './DeepLinkHandler';
import { App } from '@capacitor/app';

const mockCap = vi.hoisted(() => ({
  isNativePlatform: vi.fn(() => true),
}));

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn(),
    getLaunchUrl: vi.fn(() => Promise.resolve({ url: undefined })),
  },
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: (...args: unknown[]) =>
      mockCap.isNativePlatform(...args),
  },
}));

describe('DeepLinkHandler', () => {
  beforeEach(() => {
    vi.mocked(App.addListener).mockReset();
    vi.mocked(App.getLaunchUrl).mockReset();
    mockCap.isNativePlatform.mockReturnValue(true);
    vi.mocked(App.addListener).mockImplementation((_event, cb) => {
      (App as unknown as { _cb?: typeof cb })._cb = cb;
      return Promise.resolve({ remove: async () => {} });
    });
    vi.mocked(App.getLaunchUrl).mockResolvedValue({ url: undefined });
  });

  it('no registra listeners en web', () => {
    mockCap.isNativePlatform.mockReturnValue(false);
    const history = createMemoryHistory({ initialEntries: ['/login'] });
    render(
      <Router history={history}>
        <DeepLinkHandler />
      </Router>,
    );
    expect(App.addListener).not.toHaveBeenCalled();
  });

  it('navega a /verify-email con token cuando appUrlOpen recibe URL válida', async () => {
    const history = createMemoryHistory({ initialEntries: ['/login'] });
    render(
      <Router history={history}>
        <DeepLinkHandler />
      </Router>,
    );

    await waitFor(() => {
      expect(App.addListener).toHaveBeenCalled();
    });

    const cb = (
      App as unknown as {
        _cb?: (data: { url: string }) => void;
      }
    )._cb;
    expect(cb).toBeDefined();
    await act(async () => {
      cb!({
        url: 'https://quira.app/verify-email?token=my-token%2B1',
      });
    });

    await waitFor(() => {
      expect(history.location.pathname).toBe('/verify-email');
      expect(history.location.search).toContain('token=');
    });
    expect(decodeURIComponent(history.location.search)).toContain(
      'token=my-token+1',
    );
  });

  it('getLaunchUrl con URL de verificación navega al montar', async () => {
    vi.mocked(App.getLaunchUrl).mockResolvedValue({
      url: 'https://quira.app/verify-email?token=from-launch',
    });
    const history = createMemoryHistory({ initialEntries: ['/login'] });
    render(
      <Router history={history}>
        <DeepLinkHandler />
      </Router>,
    );

    await waitFor(() => {
      expect(history.location.pathname).toBe('/verify-email');
    });
    expect(history.location.search).toContain('from-launch');
  });
});
