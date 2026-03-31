import { beforeEach, describe, expect, it, vi } from 'vitest';
import { syncPushTokenForCurrentUser } from './pushNotifications';
import api from '../api/axios';

vi.mock('../api/axios', () => ({
  default: { patch: vi.fn() },
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(),
  },
}));

vi.mock('@capacitor-firebase/messaging', () => ({
  FirebaseMessaging: {
    requestPermissions: vi.fn(),
    getToken: vi.fn(),
  },
}));

describe('pushNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('does nothing on web platform', async () => {
    const { Capacitor } = await import('@capacitor/core');
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);

    await syncPushTokenForCurrentUser();

    expect(api.patch).not.toHaveBeenCalled();
  });

  it('does nothing without logged user id', async () => {
    const { Capacitor } = await import('@capacitor/core');
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    localStorage.setItem('user', JSON.stringify({ email: 'x@test.com' }));

    await syncPushTokenForCurrentUser();

    expect(api.patch).not.toHaveBeenCalled();
  });

  it('stores fcmToken in backend when permission granted and token changed', async () => {
    const { Capacitor } = await import('@capacitor/core');
    const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    vi.mocked(FirebaseMessaging.requestPermissions).mockResolvedValue({ receive: 'granted' } as any);
    vi.mocked(FirebaseMessaging.getToken).mockResolvedValue({ token: 'fcm-123' } as any);
    vi.mocked(api.patch).mockResolvedValue({ data: {} } as any);
    localStorage.setItem('user', JSON.stringify({ id: 7, email: 'x@test.com', fcmToken: null }));

    await syncPushTokenForCurrentUser();

    expect(api.patch).toHaveBeenCalledWith(
      '/users/7',
      { fcmToken: 'fcm-123' },
      { headers: { 'Content-Type': 'application/merge-patch+json' } },
    );
    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    expect(stored.fcmToken).toBe('fcm-123');
  });

  it('does not patch when token is unchanged', async () => {
    const { Capacitor } = await import('@capacitor/core');
    const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    vi.mocked(FirebaseMessaging.requestPermissions).mockResolvedValue({ receive: 'granted' } as any);
    vi.mocked(FirebaseMessaging.getToken).mockResolvedValue({ token: 'same-token' } as any);
    localStorage.setItem('user', JSON.stringify({ id: 7, fcmToken: 'same-token' }));

    await syncPushTokenForCurrentUser();

    expect(api.patch).not.toHaveBeenCalled();
  });

  it('does not patch when permission is denied', async () => {
    const { Capacitor } = await import('@capacitor/core');
    const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    vi.mocked(FirebaseMessaging.requestPermissions).mockResolvedValue({ receive: 'denied' } as any);
    localStorage.setItem('user', JSON.stringify({ id: 7, fcmToken: null }));

    await syncPushTokenForCurrentUser();

    expect(FirebaseMessaging.getToken).not.toHaveBeenCalled();
    expect(api.patch).not.toHaveBeenCalled();
  });
});

