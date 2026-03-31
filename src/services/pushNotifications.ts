import { Capacitor } from '@capacitor/core';
import api from '../api/axios';

interface StoredUser {
  id?: number;
  fcmToken?: string | null;
  [key: string]: unknown;
}

function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

function persistStoredUserPatch(patch: Partial<StoredUser>): void {
  const user = getStoredUser();
  if (!user) return;
  const next = { ...user, ...patch };
  localStorage.setItem('user', JSON.stringify(next));
}

/**
 * Pide permisos push, obtiene token FCM y lo sincroniza en User.fcmToken.
 * Se ejecuta solo en entorno nativo con sesión iniciada.
 */
export async function syncPushTokenForCurrentUser(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const user = getStoredUser();
  const userId = user?.id;
  if (!userId) return;

  try {
    const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
    const permissions = await FirebaseMessaging.requestPermissions();
    if (permissions.receive !== 'granted') return;

    const tokenResult = await FirebaseMessaging.getToken();
    const fcmToken = tokenResult?.token?.trim();
    if (!fcmToken) return;
    if (user?.fcmToken === fcmToken) return;

    await api.patch(
      `/users/${userId}`,
      { fcmToken },
      { headers: { 'Content-Type': 'application/merge-patch+json' } },
    );
    persistStoredUserPatch({ fcmToken });
  } catch (error) {
    console.warn('No se pudo sincronizar fcmToken:', error);
  }
}

